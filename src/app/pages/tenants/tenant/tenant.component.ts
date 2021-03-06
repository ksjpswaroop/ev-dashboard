import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'app/services/dialog.service';
import { RestResponse } from 'app/types/GlobalType';
import { HTTPError } from 'app/types/HTTPError';
import { AnalyticsSettingsType, BillingSettingsType, PricingSettingsType, RefundSettingsType, RoamingSettingsType, SmartChargingSettingsType } from 'app/types/Setting';
import { Tenant } from 'app/types/Tenant';
import TenantComponents from 'app/types/TenantComponents';

import { CentralServerService } from '../../../services/central-server.service';
import { MessageService } from '../../../services/message.service';
import { SpinnerService } from '../../../services/spinner.service';
import { Utils } from '../../../utils/Utils';

@Component({
  selector: 'app-tenant',
  templateUrl: './tenant.component.html',
})
export class TenantComponent implements OnInit {
  @Input() public currentTenantID!: string;
  @Input() public inDialog!: boolean;
  @Input() public dialogRef!: MatDialogRef<any>;

  public formGroup!: FormGroup;
  public id!: AbstractControl;
  public name!: AbstractControl;
  public subdomain!: AbstractControl;
  public email!: AbstractControl;
  public components!: FormGroup;
  public pricingTypes = [
    {
      key: PricingSettingsType.CONVERGENT_CHARGING,
      description: 'settings.pricing.convergentcharging.title',
    }, {
      key: PricingSettingsType.SIMPLE,
      description: 'settings.pricing.simple.title',
    },
  ];
  public billingTypes = [
    {
      key: BillingSettingsType.STRIPE,
      description: 'settings.billing.stripe.title',
    },
  ];
  public refundTypes = [
    {
      key: RefundSettingsType.CONCUR,
      description: 'settings.refund.concur.title',
    },
  ];
  public ocpiTypes = [
    {
      key: RoamingSettingsType.GIREVE,
      description: 'settings.ocpi.gireve.title',
    },
  ];
  public analyticsTypes = [
    {
      key: AnalyticsSettingsType.SAC,
      description: 'settings.analytics.sac.title',
    },
  ];
  public smartChargingTypes = [
    {
      key: SmartChargingSettingsType.SAP_SMART_CHARGING,
      description: 'settings.smart_charging.sap_smart_charging.title',
    },
  ];
  private currentTenant!: Tenant;

  constructor(
    private centralServerService: CentralServerService,
    private messageService: MessageService,
    private spinnerService: SpinnerService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private router: Router) {
  }

  public ngOnInit() {
    this.formGroup = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('',
        Validators.compose([
          Validators.required,
          Validators.maxLength(100),
        ])),
      email: new FormControl('',
        Validators.compose([
          Validators.required,
          Validators.email,
        ])),
      subdomain: new FormControl('',
        Validators.compose([
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern('^[a-z0-9]+$'),
        ])),
      components: new FormGroup({}),
    });
    // Assign
    this.id = this.formGroup.controls['id'];
    this.name = this.formGroup.controls['name'];
    this.email = this.formGroup.controls['email'];
    this.subdomain = this.formGroup.controls['subdomain'];
    this.subdomain = this.formGroup.controls['subdomain'];
    this.components = (this.formGroup.controls['components'] as FormGroup);
    // Create component
    for (const componentIdentifier of Object.values(TenantComponents)) {
      // Create controls
      this.components.addControl(componentIdentifier, new FormGroup({
        active: new FormControl(false),
        type: new FormControl(''),
      }));
    }
    // Load
    this.loadTenant();
  }

  public loadTenant() {
    if (this.currentTenantID) {
      this.spinnerService.show();
      this.centralServerService.getTenant(this.currentTenantID).subscribe((tenant) => {
        this.spinnerService.hide();
        if (tenant) {
          this.currentTenant = tenant;
          // Init
          this.id.setValue(this.currentTenant.id);
          this.name.setValue(this.currentTenant.name);
          this.email.setValue(this.currentTenant.email);
          this.subdomain.setValue(this.currentTenant.subdomain);
          // Add available components
          for (const componentIdentifier of Object.values(TenantComponents)) {
            // Set the params
            if (this.currentTenant.components && this.currentTenant.components[componentIdentifier]) {
              // Get component group
              const component = this.components.controls[componentIdentifier] as FormGroup;
              // Set Active
              component.controls.active.setValue(
                this.currentTenant.components[componentIdentifier].active === true);
              // Set Type
              component.controls.type.setValue(
                this.currentTenant.components[componentIdentifier].type);
            }
          }
        }
      }, (error) => {
        // Hide
        this.spinnerService.hide();
        Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.unexpected_error_backend');
        this.dialogRef.close();
      });
    }
  }

  public closeDialog(saved: boolean = false) {
    if (this.inDialog) {
      this.dialogRef.close(saved);
    }
  }

  public close() {
    Utils.checkAndSaveAndCloseDialog(this.formGroup, this.dialogService,
      this.translateService, this.saveTenant.bind(this), this.closeDialog.bind(this));
  }

  public saveTenant(tenant: Tenant) {
    // Clear Type of inactive tenants
    let pricingActive = false;
    let refundActive = false;
    let billingActive = false;
    let smartChargingActive = false;
    let organizationActive = false;
    let assetActive = false;
    let carActive = false;

    for (const component in tenant.components) {
      if (Utils.objectHasProperty(tenant.components, component)) {
        if (!tenant.components[component].active) {
          tenant.components[component].type = null;
        }
        if (component === TenantComponents.PRICING) {
          pricingActive = tenant.components[component].active;
        }
        if (component === TenantComponents.REFUND) {
          refundActive = tenant.components[component].active;
        }
        if (component === TenantComponents.BILLING) {
          billingActive = tenant.components[component].active;
        }
        if (component === TenantComponents.SMART_CHARGING) {
          smartChargingActive = tenant.components[component].active;
        }
        if (component === TenantComponents.ORGANIZATION) {
          organizationActive = tenant.components[component].active;
        }
        if (component === TenantComponents.ASSET) {
          assetActive = tenant.components[component].active;
        }
        if (component === TenantComponents.CAR) {
          carActive = tenant.components[component].active;
        }
      }
    }
    if (refundActive && !pricingActive) {
      this.messageService.showErrorMessage('tenants.save_error_refund');
      return;
    }
    if (billingActive && !pricingActive) {
      this.messageService.showErrorMessage('tenants.save_error_billing');
      return;
    }
    if (smartChargingActive && !organizationActive) {
      this.messageService.showErrorMessage('tenants.save_error_smart_charging');
      return;
    }
    if (assetActive && !organizationActive) {
      this.messageService.showErrorMessage('tenants.save_error_asset');
      return;
    }
    if (this.currentTenant) {
      // update existing tenant
      this.updateTenant(tenant);
    } else {
      // create new tenant
      this.createTenant(tenant);
    }
  }

  private createTenant(tenant: Tenant) {
    this.spinnerService.show();
    this.centralServerService.createTenant(tenant).subscribe((response) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('tenants.create_success', { name: tenant.name });
        this.dialogRef.close(true);
      } else {
        Utils.handleError(JSON.stringify(response), this.messageService, 'tenants.create_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'tenants.create_error');
    });
  }

  private updateTenant(tenant: Tenant) {
    this.spinnerService.show();
    this.centralServerService.updateTenant(tenant).subscribe((response) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('tenants.update_success', { name: tenant.name });
        this.dialogRef.close(true);
      } else {
        Utils.handleError(JSON.stringify(response), this.messageService, 'tenants.update_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      if (error.status === HTTPError.SMART_CHARGING_STILL_ACTIVE_FOR_SITE_AREA) {
        Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'tenants.smart_charging_still_active_for_site_area');
      } else {
        Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'tenants.update_error');
      }
    });
  }
}
