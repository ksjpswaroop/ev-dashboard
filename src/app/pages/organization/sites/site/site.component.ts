import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from 'app/services/authorization.service';
import { CentralServerService } from 'app/services/central-server.service';
import { ConfigService } from 'app/services/config.service';
import { DialogService } from 'app/services/dialog.service';
import { MessageService } from 'app/services/message.service';
import { SpinnerService } from 'app/services/spinner.service';
import { CompaniesDialogComponent } from 'app/shared/dialogs/companies/companies-dialog.component';
import { Address } from 'app/types/Address';
import { Action, Entity } from 'app/types/Authorization';
import { Company } from 'app/types/Company';
import { RestResponse } from 'app/types/GlobalType';
import { HTTPError } from 'app/types/HTTPError';
import { Site, SiteImage } from 'app/types/Site';
import { ButtonType } from 'app/types/Table';
import { Utils } from 'app/utils/Utils';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-site',
  templateUrl: 'site.component.html',
})
export class SiteComponent implements OnInit {
  @Input() public currentSiteID!: string;
  @Input() public inDialog!: boolean;
  @Input() public dialogRef!: MatDialogRef<any>;

  public image: any = SiteImage.NO_IMAGE;
  public maxSize: number;

  public formGroup!: FormGroup;
  public id!: AbstractControl;
  public name!: AbstractControl;
  public company!: AbstractControl;
  public companyID!: AbstractControl;
  public autoUserSiteAssignment!: AbstractControl;

  public address!: Address;
  public isAdmin = false;

  constructor(
    private authorizationService: AuthorizationService,
    private centralServerService: CentralServerService,
    private messageService: MessageService,
    private spinnerService: SpinnerService,
    private translateService: TranslateService,
    private configService: ConfigService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private router: Router) {
    this.maxSize = this.configService.getSite().maxPictureKb;
    // Check auth
    if (this.activatedRoute.snapshot.params['id'] &&
      !authorizationService.canUpdateSite()) {
      // Not authorized
      this.router.navigate(['/']);
    }
    // Set
    this.isAdmin = this.authorizationService.canAccess(Entity.SITE, Action.CREATE);
  }

  public ngOnInit() {
    // Init the form
    this.formGroup = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      company: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      companyID: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      autoUserSiteAssignment: new FormControl(false),
    });
    // Form
    this.id = this.formGroup.controls['id'];
    this.name = this.formGroup.controls['name'];
    this.company = this.formGroup.controls['company'];
    this.companyID = this.formGroup.controls['companyID'];
    this.autoUserSiteAssignment = this.formGroup.controls['autoUserSiteAssignment'];
    if (this.currentSiteID) {
      this.loadSite();
    } else if (this.activatedRoute && this.activatedRoute.params) {
      this.activatedRoute.params.subscribe((params: Params) => {
        this.currentSiteID = params['id'];
        // this.loadSite();
      });
    }
  }

  public isOpenInDialog(): boolean {
    return this.inDialog;
  }

  public setCurrentSiteId(currentSiteID: string) {
    this.currentSiteID = currentSiteID;
  }

  public assignCompany() {
    // Create the dialog
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    dialogConfig.data = {
      title: 'sites.assign_company',
      validateButtonTitle: 'general.select',
      sitesAdminOnly: true,
      rowMultipleSelection: false,
    };
    // Open
    this.dialog.open(CompaniesDialogComponent, dialogConfig).afterClosed().subscribe((result) => {
      if (result && result.length > 0 && result[0] && result[0].objectRef) {
        const company: Company = (result[0].objectRef) as Company;
        this.company.setValue(company.name);
        this.companyID.setValue(company.id);
        this.formGroup.markAsDirty();
      }
    });
  }

  public refresh() {
    this.loadSite();
  }

  public loadSite() {
    if (!this.currentSiteID) {
      return;
    }
    this.isAdmin = this.authorizationService.canAccess(Entity.SITE, Action.CREATE) ||
      this.authorizationService.isSiteAdmin(this.currentSiteID) ||
      this.authorizationService.isSiteOwner(this.currentSiteID);
    // if not admin switch in readonly mode
    if (!this.isAdmin) {
      this.formGroup.disable();
    }
    this.spinnerService.show();
    this.centralServerService.getSite(this.currentSiteID, false, true).pipe(mergeMap((site) => {
      // Init form
      if (site.id) {
        this.formGroup.controls.id.setValue(site.id);
      }
      if (site.name) {
        this.formGroup.controls.name.setValue(site.name);
      }
      if (site.companyID) {
        this.formGroup.controls.companyID.setValue(site.companyID);
      }
      if (site.company) {
        this.formGroup.controls.company.setValue(site.company.name);
      }
      if (site.autoUserSiteAssignment) {
        this.formGroup.controls.autoUserSiteAssignment.setValue(site.autoUserSiteAssignment);
      } else {
        this.formGroup.controls.autoUserSiteAssignment.setValue(false);
      }
      if (site.address) {
        this.address = site.address;
      }
      this.formGroup.updateValueAndValidity();
      this.formGroup.markAsPristine();
      this.formGroup.markAllAsTouched();
      // Yes, get image
      return this.centralServerService.getSiteImage(this.currentSiteID);
    })).subscribe((siteImage) => {
      if (siteImage && siteImage.image) {
        this.image = siteImage.image.toString();
      }
      this.spinnerService.hide();
    }, (error) => {
      this.spinnerService.hide();
      switch (error.status) {
        case HTTPError.OBJECT_DOES_NOT_EXIST_ERROR:
          this.messageService.showErrorMessage('sites.site_not_found');
          break;
        default:
          Utils.handleHttpError(error, this.router, this.messageService,
            this.centralServerService, 'general.unexpected_error_backend');
      }
    });
  }

  public updateSiteImage(site: Site) {
    // Check no image?
    if (!this.image.endsWith(SiteImage.NO_IMAGE)) {
      // Set to site
      site.image = this.image;
    } else {
      // No image
      delete site.image;
    }
  }

  public updateSiteCoordinates(site: Site) {
    if (site.address && site.address.coordinates &&
      !(site.address.coordinates[0] || site.address.coordinates[1])) {
      delete site.address.coordinates;
    }
  }

  public saveSite(site: Site) {
    if (this.currentSiteID) {
      this.updateSite(site);
    } else {
      this.createSite(site);
    }
  }

  public imageChanged(event: any) {
    // load picture
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > (this.maxSize * 1024)) {
        this.messageService.showErrorMessage('sites.image_size_error', { maxPictureKb: this.maxSize });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          this.image = reader.result as string;
          this.formGroup.markAsDirty();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  public clearImage() {
    // Clear
    this.image = SiteImage.NO_IMAGE;
    // Set form dirty
    this.formGroup.markAsDirty();
  }

  public closeDialog(saved: boolean = false) {
    if (this.inDialog) {
      this.dialogRef.close(saved);
    }
  }

  public close() {
    Utils.checkAndSaveAndCloseDialog(this.formGroup, this.dialogService,
      this.translateService, this.saveSite.bind(this), this.closeDialog.bind(this));
  }

  private createSite(site: Site) {
    this.spinnerService.show();
    // Set the image
    this.updateSiteImage(site);
    // Set coordinates
    this.updateSiteCoordinates(site);
    // Create
    this.centralServerService.createSite(site).subscribe((response) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('sites.create_success',
          { siteName: site.name });
        this.currentSiteID = site.id;
        this.closeDialog(true);
      } else {
        Utils.handleError(JSON.stringify(response),
          this.messageService, 'sites.create_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      switch (error.status) {
        case HTTPError.OBJECT_DOES_NOT_EXIST_ERROR:
          this.messageService.showErrorMessage('sites.site_not_found');
          break;
        default:
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'site.create_error');
      }
    });
  }

  private updateSite(site: Site) {
    this.spinnerService.show();
    // Set the image
    this.updateSiteImage(site);
    // Set coordinates
    this.updateSiteCoordinates(site);
    // Update
    this.centralServerService.updateSite(site).subscribe((response) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('sites.update_success', { siteName: site.name });
        this.closeDialog(true);
      } else {
        Utils.handleError(JSON.stringify(response),
          this.messageService, 'sites.update_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      switch (error.status) {
        case HTTPError.OBJECT_DOES_NOT_EXIST_ERROR:
          this.messageService.showErrorMessage('sites.site_not_found');
          break;
        default:
          Utils.handleHttpError(error, this.router, this.messageService,
            this.centralServerService, 'sites.update_error');
      }
    });
  }
}
