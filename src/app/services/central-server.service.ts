import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TranslateService } from '@ngx-translate/core';
import { Asset } from 'app/types/Asset';
import { BillingInvoice, BillingTax } from 'app/types/Billing';
import { Car, CarCatalog, CarMakersTable, ImageObject } from 'app/types/Car';
import { ChargingProfile, GetCompositeScheduleCommandResult } from 'app/types/ChargingProfile';
import { ChargePoint, ChargingStation, OCPPAvailabilityType, OcppParameter } from 'app/types/ChargingStation';
import { Company } from 'app/types/Company';
import { IntegrationConnection, UserConnection } from 'app/types/Connection';
import { ActionResponse, ActionsResponse, DataResult, LoginResponse, OCPIGenerateLocalTokenResponse, OCPIJobStatusesResponse, OCPIPingResponse, OCPITriggerJobsResponse, Ordering, Paging, ValidateBillingConnectionResponse } from 'app/types/DataResult';
import { EndUserLicenseAgreement } from 'app/types/Eula';
import { FilterParams, Image, KeyValue, Logo } from 'app/types/GlobalType';
import { AssetInError, ChargingStationInError, TransactionInError } from 'app/types/InError';
import { Log } from 'app/types/Log';
import { OcpiEndpoint } from 'app/types/OCPIEndpoint';
import { RefundReport } from 'app/types/Refund';
import { RegistrationToken } from 'app/types/RegistrationToken';
import { ServerAction } from 'app/types/Server';
import { Setting } from 'app/types/Setting';
import { Site, SiteUser, UserSite } from 'app/types/Site';
import { SiteArea, SiteAreaConsumption } from 'app/types/SiteArea';
import { StatisticData } from 'app/types/Statistic';
import { Tenant } from 'app/types/Tenant';
import { Transaction } from 'app/types/Transaction';
import { User, UserToken } from 'app/types/User';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Constants } from '../utils/Constants';
import { CentralServerNotificationService } from './central-server-notification.service';
import { ConfigService } from './config.service';
import { LocalStorageService } from './local-storage.service';
import { WindowService } from './window.service';

@Injectable()
export class CentralServerService {
  private centralRestServerServiceBaseURL!: string;
  private centralRestServerServiceSecuredURL!: string;
  private centralRestServerServiceAuthURL!: string;
  private centralRestServerServiceUtilURL!: string;
  private centralSystemServerConfig: any;
  private initialized = false;
  private currentUserToken!: string;
  private currentUser!: UserToken;
  private currentUserSubject = new BehaviorSubject<UserToken>(this.currentUser);

  constructor(
    private httpClient: HttpClient,
    private translateService: TranslateService,
    private localStorageService: LocalStorageService,
    private centralServerNotificationService: CentralServerNotificationService,
    private configService: ConfigService,
    private windowService: WindowService,
    private dialog: MatDialog) {
    // Default
    this.initialized = false;
  }

  public removeChargersFromSiteArea(siteAreaID: string, chargerIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RemoveChargingStationsFromSiteArea`,
      { siteAreaID, chargingStationIDs: chargerIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteTransactions(transactionsIDs: number[]): Observable<ActionsResponse> {
    // Verify init
    this.checkInit();
    const options = {
      headers: this.buildHttpHeaders(),
      body: { transactionsIDs },
    };
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TransactionsDelete`, options)
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public addChargersToSiteArea(siteAreaID: string, chargerIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AddChargingStationsToSiteArea`,
      { siteAreaID, chargingStationIDs: chargerIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public addAssetsToSiteArea(siteAreaID: string, assetIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AddAssetsToSiteArea`,
      { siteAreaID, assetIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public removeAssetsFromSiteArea(siteAreaID: string, assetIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RemoveAssetsFromSiteArea`,
      { siteAreaID, assetIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public removeUsersFromSite(siteID: string, userIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RemoveUsersFromSite`,
      { siteID, userIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public addUsersToSite(siteID: string, userIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AddUsersToSite`,
      { siteID, userIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateSiteUserAdmin(siteID: string, userID: string, siteAdmin: boolean): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteUserAdmin`,
      { siteID, userID, siteAdmin },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateSiteOwner(siteID: string, userID: string, siteOwner: boolean): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteOwner`,
      { siteID, userID, siteOwner },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public removeSitesFromUser(userID: string, siteIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RemoveSitesFromUser`,
      { userID, siteIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public addSitesToUser(userID: string, siteIDs: string[]): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AddSitesToUser`,
      { userID, siteIDs },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCompanies(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Company>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Company>>(
      `${this.centralRestServerServiceSecuredURL}/Companies`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCompany(companyId: string, withLogo: boolean = false): Observable<Company> {
    const params: { [param: string]: string } = {};
    params['ID'] = companyId;
    params['WithLogo'] = withLogo.toString();
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Company>(
      `${this.centralRestServerServiceSecuredURL}/Company`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCompanyLogos(): Observable<Logo[]> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Logo[]>(
      `${this.centralRestServerServiceSecuredURL}/CompanyLogos`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCompanyLogo(companyId: string): Observable<Logo> {
    const params: { [param: string]: string } = {};
    params['ID'] = companyId;
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Logo>(
      `${this.centralRestServerServiceSecuredURL}/CompanyLogo`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getAssets(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Asset>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Asset>>(
      `${this.centralRestServerServiceSecuredURL}/Assets`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getAsset(assetId: string, withImage: boolean = false, withSiteArea: boolean = false): Observable<Asset> {
    const params: { [param: string]: string } = {};
    params['ID'] = assetId;
    params['WithImage'] = withImage.toString();
    params['WithSiteArea'] = withSiteArea.toString();
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Asset>(
      `${this.centralRestServerServiceSecuredURL}/Asset`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getAssetImage(assetId: string): Observable<Image> {
    const params: { [param: string]: string } = {};
    params['ID'] = assetId;
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Image>(
      `${this.centralRestServerServiceSecuredURL}/AssetImage`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getAssetsInError(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<AssetInError>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<AssetInError>>(`${this.centralRestServerServiceSecuredURL}/AssetsInError`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserSites(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<SiteUser>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<SiteUser>>(`${this.centralRestServerServiceSecuredURL}/UserSites`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSites(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Site>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Site>>(
      `${this.centralRestServerServiceSecuredURL}/Sites`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingProfiles(chargeBoxID: string, connectorID?: number): Observable<DataResult<ChargingProfile>> {
    this.checkInit();
    const params: { [param: string]: string } = {};
    params['ChargeBoxID'] = chargeBoxID;
    if (connectorID) {
      params['ConnectorID'] = connectorID + '';
    }
    return this.httpClient.get<DataResult<ChargingProfile>>(
      `${this.centralRestServerServiceSecuredURL}/ChargingProfiles`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public triggerSmartCharging(siteAreaID: string): Observable<ActionResponse> {
    this.checkInit();
    const params: { [param: string]: string } = {};
    params['SiteAreaID'] = siteAreaID;
    return this.httpClient.get<ActionResponse>(
      `${this.centralRestServerServiceSecuredURL}/TriggerSmartCharging`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSite(siteID: string, withImage: boolean = false, withCompany: boolean = false): Observable<Site> {
    const params: { [param: string]: string } = {};
    params['ID'] = siteID;
    params['WithImage'] = withImage.toString();
    params['WithCompany'] = withImage.toString();
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Site>(
      `${this.centralRestServerServiceSecuredURL}/Site`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteImage(siteID: string): Observable<Image> {
    const params: { [param: string]: string } = {};
    params['ID'] = siteID;
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Image>(
      `${this.centralRestServerServiceSecuredURL}/SiteImage`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteAreas(params: FilterParams = {},
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<SiteArea>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<SiteArea>>(
      `${this.centralRestServerServiceSecuredURL}/SiteAreas`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteArea(siteAreaID: string, withSite?: boolean): Observable<SiteArea> {
    const params: { [param: string]: string } = {};
    params['ID'] = siteAreaID;
    if (withSite) {
      params['WithSite'] = withSite.toString();
    }
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<SiteArea>(
      `${this.centralRestServerServiceSecuredURL}/SiteArea`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteAreaImage(siteAreaID: string): Observable<Image> {
    const params: { [param: string]: string } = {};
    params['ID'] = siteAreaID;
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Image>(
      `${this.centralRestServerServiceSecuredURL}/SiteAreaImage`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactionYears(): Observable<number[]> {
    const params: { [param: string]: string } = {};
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<number[]>(`${this.centralRestServerServiceSecuredURL}/TransactionYears`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationConsumptionStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/ChargingStationConsumptionStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserConsumptionStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/UserConsumptionStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationUsageStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/ChargingStationUsageStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserUsageStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/UserUsageStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationInactivityStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/ChargingStationInactivityStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserInactivityStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/UserInactivityStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getLastTransaction(chargingStationID: string, connectorID: number): Observable<DataResult<Transaction>> {
    const params: { [param: string]: string } = {};
    params['ChargeBoxID'] = chargingStationID;
    params['ConnectorId'] = connectorID.toString();
    params['Limit'] = '1';
    params['Skip'] = '0';
    params['SortFields'] = 'timestamp';
    params['SortDirs'] = '-1';

    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<DataResult<Transaction>>(`${this.centralRestServerServiceSecuredURL}/ChargingStationTransactions`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationTransactionsStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/ChargingStationTransactionsStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserTransactionsStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/UserTransactionsStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationPricingStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/ChargingStationPricingStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserPricingStatistics(year: number,
    params: FilterParams = {}): Observable<StatisticData[]> {
    params['Year'] = year + '';
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<StatisticData[]>(`${this.centralRestServerServiceSecuredURL}/UserPricingStatistics`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStations(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<ChargingStation>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<ChargingStation>>(`${this.centralRestServerServiceSecuredURL}/ChargingStations`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStation(id: string): Observable<ChargingStation> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Execute the REST service
    return this.httpClient.get<ChargingStation>(`${this.centralRestServerServiceSecuredURL}/ChargingStation`,
      {
        headers: this.buildHttpHeaders(),
        params: { ID: id },
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  // tslint:disable-next-line:max-line-length
  public getChargingStationsInError(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<ChargingStationInError>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<ChargingStationInError>>(`${this.centralRestServerServiceSecuredURL}/ChargingStationsInError`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteUsers(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<UserSite>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<UserSite>>(`${this.centralRestServerServiceSecuredURL}/SiteUsers`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUsers(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<User>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<User>>(`${this.centralRestServerServiceSecuredURL}/Users`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUsersInError(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<User>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<User>>(`${this.centralRestServerServiceSecuredURL}/UsersInError`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTenants(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Tenant>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Tenant>>(`${this.centralRestServerServiceSecuredURL}/Tenants`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTenant(id: string): Observable<Tenant> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Execute the REST service
    return this.httpClient.get<Tenant>(`${this.centralRestServerServiceSecuredURL}/Tenant`,
      {
        headers: this.buildHttpHeaders(),
        params: { ID: id },
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactions(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Transaction>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Transaction>>(`${this.centralRestServerServiceSecuredURL}/TransactionsCompleted`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactionsToRefund(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING,
    ordering: Ordering[] = []): Observable<DataResult<Transaction>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Transaction>>(`${this.centralRestServerServiceSecuredURL}/TransactionsToRefund`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getRefundReports(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING,
    ordering: Ordering[] = []): Observable<DataResult<RefundReport>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<RefundReport>>(`${this.centralRestServerServiceSecuredURL}/TransactionsRefundReports`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactionsToRefundList(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Transaction>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Transaction>>(`${this.centralRestServerServiceSecuredURL}/TransactionsToRefundList`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public assignTransactionsToUser(userId: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AssignTransactionsToUser`, null,
      {
        headers: this.buildHttpHeaders(),
        params: { UserID: userId },
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUnassignedTransactionsCount(userId: string): Observable<number> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<number>(`${this.centralRestServerServiceSecuredURL}/UnassignedTransactionsCount`,
      {
        headers: this.buildHttpHeaders(),
        params: { UserID: userId },
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransaction(id: number): Observable<Transaction> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Execute the REST service
    return this.httpClient.get<Transaction>(`${this.centralRestServerServiceSecuredURL}/Transaction`,
      {
        headers: this.buildHttpHeaders(),
        params: { ID: id.toString() },
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportLogs(params: FilterParams): Observable<Blob> {
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/LoggingsExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportTransactions(params: FilterParams): Observable<Blob> {
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/TransactionsExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportTransactionsToRefund(params: FilterParams): Observable<Blob> {
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/TransactionsToRefundExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportStatistics(params: FilterParams): Observable<Blob> {
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/StatisticsExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportChargingStations(params: FilterParams): Observable<Blob> {
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/ChargingStationsExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public exportAllChargingStationsOCCPParams(params: FilterParams): Observable<Blob> {
    // Verify init
    this.checkInit();
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/ChargingStationsOCPPParamsExport`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactionsInError(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<TransactionInError>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<TransactionInError>>(`${this.centralRestServerServiceSecuredURL}/TransactionsInError`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getActiveTransactions(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = [])
    : Observable<DataResult<Transaction>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Transaction>>(`${this.centralRestServerServiceSecuredURL}/TransactionsActive`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  // tslint:disable-next-line:max-line-length
  public getOcpiEndpoints(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<OcpiEndpoint>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<OcpiEndpoint>>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpoints`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSiteAreaConsumption(siteAreaID: string, startDate: Date, endDate: Date): Observable<SiteAreaConsumption> {
    const params: { [param: string]: string } = {};
    params['SiteAreaID'] = siteAreaID;
    params['StartDate'] = startDate.toISOString();
    params['EndDate'] = endDate.toISOString();
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<SiteAreaConsumption>(
      `${this.centralRestServerServiceSecuredURL}/SiteAreaConsumption`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getTransactionConsumption(transactionId: number, loadAllConsumptions?: boolean, ordering: Ordering[] = []): Observable<Transaction> {
    const params: { [param: string]: string } = {};
    params['TransactionId'] = transactionId.toString();
    if (loadAllConsumptions) {
      params['LoadAllConsumptions'] = loadAllConsumptions.toString();
    }
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<Transaction>(
      `${this.centralRestServerServiceSecuredURL}/TransactionConsumption`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createTenant(tenant: Tenant): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TenantCreate`, tenant,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateTenant(tenant: Tenant): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TenantUpdate`, tenant,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteTenant(id: string): Observable<ActionResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TenantDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getLogs(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Log>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    // Execute
    return this.httpClient.get<DataResult<Log>>(`${this.centralRestServerServiceSecuredURL}/Loggings`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getLog(id: string): Observable<Log> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Call
    return this.httpClient.get<Log>(`${this.centralRestServerServiceSecuredURL}/Logging?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserImage(id: string): Observable<Image> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    if (!id) {
      return EMPTY;
    }
    return this.httpClient.get<Image>(`${this.centralRestServerServiceSecuredURL}/UserImage?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUser(id: string): Observable<User> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Execute the REST service
    return this.httpClient.get<User>(`${this.centralRestServerServiceSecuredURL}/User?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserInvoice(id: string): Observable<Blob> {
    // Verify init
    this.checkInit();
    if (!id) {
      return EMPTY;
    }
    // Execute the REST service
    return this.httpClient.get(`${this.centralRestServerServiceSecuredURL}/UserInvoice?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
        responseType: 'blob',
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getSettings(identifier: string, contentFilter = false): Observable<DataResult<Setting>> {
    // verify init
    this.checkInit();
    // Execute the REST Service
    return this.httpClient.get<DataResult<Setting>>(`${this.centralRestServerServiceSecuredURL}/Settings?Identifier=${identifier}&ContentFilter=${contentFilter}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public checkBillingConnection(): Observable<ValidateBillingConnectionResponse> {
    // verify init
    this.checkInit();
    // Execute the REST Service
    return this.httpClient.get<ValidateBillingConnectionResponse>(`${this.centralRestServerServiceSecuredURL}/CheckBillingConnection`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public synchronizeUsersForBilling(): Observable<ActionsResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionsResponse>(`${this.centralRestServerServiceSecuredURL}/BillingSynchronizeUsers`, {},
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public synchronizeUserForBilling(userID: string): Observable<ActionResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/BillingSynchronizeUser`, { id: userID },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public forceSynchronizeUserForBilling(userID: string): Observable<ActionResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/BillingForceSynchronizeUser`,
      { id: userID },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getBillingTaxes(): Observable<BillingTax[]> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<BillingTax[]>(`${this.centralRestServerServiceSecuredURL}/BillingTaxes`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getUserInvoices(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<BillingInvoice>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<BillingInvoice>>(`${this.centralRestServerServiceSecuredURL}/BillingUserInvoices`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public synchronizeInvoices(): Observable<ActionsResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionsResponse>(`${this.centralRestServerServiceSecuredURL}/BillingSynchronizeInvoices`, {},
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public forceSynchronizeUserInvoicesForBilling(userID: string): Observable<ActionsResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionsResponse>(`${this.centralRestServerServiceSecuredURL}/BillingForceSynchronizeUserInvoices`,
      { userID },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getRegistrationTokens(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<RegistrationToken>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<RegistrationToken>>(`${this.centralRestServerServiceSecuredURL}/RegistrationTokens`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createRegistrationToken(registrationToken: Partial<RegistrationToken> = {}): Observable<RegistrationToken> {
    this.checkInit();
    return this.httpClient.post<RegistrationToken>(`${this.centralRestServerServiceSecuredURL}/RegistrationTokenCreate`, registrationToken,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteRegistrationToken(id: string): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RegistrationTokenDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public revokeRegistrationToken(id: string): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/RegistrationTokenRevoke?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getEndUserLicenseAgreement(language: string): Observable<EndUserLicenseAgreement> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<EndUserLicenseAgreement>(`${this.centralRestServerServiceAuthURL}/EndUserLicenseAgreement?Language=${language}`,
      {
        headers: this.buildHttpHeaders(this.windowService.getSubdomain()),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public login(user: any): Observable<LoginResponse> {
    // Verify init
    this.checkInit();
    // Set the tenant
    user['tenant'] = this.windowService.getSubdomain();
    // Execute
    return this.httpClient.post<LoginResponse>(`${this.centralRestServerServiceAuthURL}/Login`, user,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  // public refreshToken(): Observable<LoginResponse> {
  //   // Verify init
  //   this.checkInit();
  //   // Execute
  //   return this.httpClient.get<LoginResponse>(`${this.centralRestServerServiceSecuredURL}/UserRefreshToken`,
  //     {
  //       headers: this.buildHttpHeaders(),
  //     })
  //     .pipe(
  //       catchError(this.handleHttpError),
  //     );
  // }

  public loginSucceeded(token: string): void {
    // Keep it local (iFrame use case)
    this.setLoggedUserToken(token, true);
    // Init Socket IO at user login
    if (this.configService.getCentralSystemServer().socketIOEnabled && this.getLoggedUser() && this.isAuthenticated()) {
      this.centralServerNotificationService.initSocketIO(this.getLoggedUserToken());
    }
  }

  public getLoggedUser(): UserToken {
    this.getLoggedUserFromToken();
    // Return the user (should have already been initialized as the token is retrieved async)
    return this.currentUser;
  }

  public getLoggedUserFromToken(): UserToken {
    // Get the token
    if (!this.currentUser) {
      // Decode the token
      this.localStorageService.getItem('token').subscribe((token: string) => {
        // Keep it local (iFrame use case)
        this.setLoggedUserToken(token);
      });
    }
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.getLoggedUserToken() && !new JwtHelperService().isTokenExpired(this.getLoggedUserToken());
  }

  private setLoggedUserToken(token: string, writeInLocalStorage?: boolean): void {
    // Keep token
    this.currentUserToken = token;
    this.currentUser = null;
    // Not null?
    if (token) {
      // Decode the token
      this.currentUser = new JwtHelperService().decodeToken(token);
    }
    this.currentUserSubject.next(this.currentUser);
    // Write?
    if (writeInLocalStorage) {
      // Set the token
      this.localStorageService.setItem('token', token);
    }
  }

  private getLoggedUserToken(): string {
    // Get the token
    if (!this.currentUserToken) {
      // Decode the token
      this.localStorageService.getItem('token').subscribe((token: string) => {
        // Keep it local (iFrame use case)
        this.setLoggedUserToken(token);
      });
    }
    return this.currentUserToken;
  }

  public getCurrentUserSubject(): BehaviorSubject<UserToken> {
    return this.currentUserSubject;
  }

  private clearLoggedUserToken(): void {
    // Clear
    this.currentUserToken = null;
    this.currentUser = null;
    this.currentUserSubject.next(this.currentUser);
    // Remove from local storage
    this.localStorageService.removeItem('token');
  }

  public logout(): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<ActionResponse>(`${this.centralRestServerServiceAuthURL}/Logout`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public logoutSucceeded(): void {
    this.dialog.closeAll();
    this.clearLoggedUserToken();
    if (this.configService.getCentralSystemServer().socketIOEnabled) {
      this.centralServerNotificationService.resetSocketIO();
    }
  }

  public resetUserPassword(data: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Set the tenant
    data['tenant'] = this.windowService.getSubdomain();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceAuthURL}/Reset`, data,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public registerUser(user: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Set the tenant
    user['tenant'] = this.windowService.getSubdomain();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceAuthURL}/RegisterUser`, user,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createUser(user: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/UserCreate`, user,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateUser(user: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/UserUpdate`, user,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createCompany(company: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/CompanyCreate`, company,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateCompany(company: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/CompanyUpdate`, company,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteCompany(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/CompanyDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createAsset(asset: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AssetCreate`, asset,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateAsset(asset: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AssetUpdate`, asset,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteAsset(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/AssetDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createSite(site: Site): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteCreate`, site,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateSite(site: Site): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteUpdate`, site,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteSite(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createSiteArea(siteArea: SiteArea): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteAreaCreate`, siteArea,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateSiteArea(siteArea: SiteArea): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteAreaUpdate`, siteArea,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteSiteArea(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SiteAreaDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public checkSmartChargingConnection(): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.get<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/CheckSmartChargingConnection`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateSetting(setting: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SettingUpdate`, setting,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createOcpiEndpoint(ocpiEndpoint: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointCreate`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public sendEVSEStatusesOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointSendEVSEStatuses`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public triggerJobsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPITriggerJobsResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPITriggerJobsResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointTriggerJobs`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public sendTokensOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointSendTokens`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public pullLocationsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointPullLocations`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public pullSessionsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointPullSessions`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public pullTokensOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointPullTokens`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public pullCdrsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointPullCdrs`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public checkLocationsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointCheckLocations`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public checkCdrsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointCheckCdrs`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public checkSessionsOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<OCPIJobStatusesResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIJobStatusesResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointCheckSessions`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public pingOcpiEndpoint(ocpiEndpoint: any): Observable<OCPIPingResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIPingResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointPing`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public generateLocalTokenOcpiEndpoint(ocpiEndpoint: any): Observable<OCPIGenerateLocalTokenResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<OCPIGenerateLocalTokenResponse>(
      `${this.centralRestServerServiceSecuredURL}/OcpiEndpointGenerateLocalToken`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateOcpiEndpoint(ocpiEndpoint: OcpiEndpoint): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointUpdate`, ocpiEndpoint,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteOcpiEndpoint(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public unregisterOcpiEndpoint(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointUnregister?ID=${id}`,
      `{ "id": "${id}" }`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public registerOcpiEndpoint(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/OcpiEndpointRegister?ID=${id}`,
      `{ "id": "${id}" }`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteUser(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/UserDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public verifyEmail(params: FilterParams): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Set the tenant
    params['Tenant'] = this.windowService.getSubdomain();
    // Execute the REST service
    return this.httpClient.get<ActionResponse>(
      `${this.centralRestServerServiceAuthURL}/VerifyEmail`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public resendVerificationEmail(user: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Set the tenant
    user['tenant'] = this.windowService.getSubdomain();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceAuthURL}/ResendVerificationEmail`, user,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteTransaction(id: number): Observable<ActionResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TransactionDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public refundTransactions(ids: number[]): Observable<ActionsResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TransactionsRefund`, { transactionIds: ids },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public synchronizeRefundedTransactions(): Observable<ActionResponse> {
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/SynchronizeRefundedTransactions`, {},
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public softStopTransaction(id: number): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/TransactionSoftStop`,
      `{ "ID": "${id}" }`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationStopTransaction(chargeBoxId: string, transactionId: number): Observable<ActionResponse> {
    this.checkInit();
    const body = {
      chargeBoxID: chargeBoxId,
      args: {
        transactionId,
      },
    };
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationRemoteStopTransaction`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationStartTransaction(chargeBoxId: string, connectorId: number, tagID: string): Observable<ActionResponse> {
    this.checkInit();
    const body = {
      chargeBoxID: chargeBoxId,
      args: {
        tagID,
        connectorId,
      },
    };
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationRemoteStartTransaction`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateChargingStationParams(chargingStation: ChargingStation): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationUpdateParams`, chargingStation,
      {
        headers: this.buildHttpHeaders(this.windowService.getSubdomain()),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateChargingProfile(chargingProfile: ChargingProfile): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingProfileUpdate`, chargingProfile,
      {
        headers: this.buildHttpHeaders(this.windowService.getSubdomain()),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteChargingProfile(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.delete<ActionResponse>(
      `${this.centralRestServerServiceSecuredURL}/ChargingProfileDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteChargingStation(id: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.delete<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationOcppParameters(chargingStationID: string): Observable<DataResult<OcppParameter>> {
    // Verify Init
    this.checkInit();
    // Execute REST Service
    return this.httpClient.get<DataResult<OcppParameter>>(
      `${this.centralRestServerServiceSecuredURL}/ChargingStationOcppParameters?ChargeBoxID=${chargingStationID}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCarCatalogs(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<CarCatalog>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<CarCatalog>>(
      `${this.centralRestServerServiceSecuredURL}/CarCatalogs`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCars(params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING, ordering: Ordering[] = []): Observable<DataResult<Car>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Build Ordering
    this.getSorting(ordering, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<Car>>(
      `${this.centralRestServerServiceSecuredURL}/Cars`,
      {
        headers: this.buildHttpHeaders(),
        params,
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCarCatalog(carCatalogID: number): Observable<CarCatalog> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<CarCatalog>(
      `${this.centralRestServerServiceSecuredURL}/CarCatalog?CarCatalogID=${carCatalogID}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCarCatalogImages(carCatalogID: number, params: FilterParams,
    paging: Paging = Constants.DEFAULT_PAGING): Observable<DataResult<ImageObject>> {
    // Verify init
    this.checkInit();
    // Build Paging
    this.getPaging(paging, params);
    // Execute the REST service
    return this.httpClient.get<DataResult<ImageObject>>(
      `${this.centralRestServerServiceSecuredURL}/CarCatalogImages?CarCatalogID=${carCatalogID}`,
      {
        headers: this.buildHttpHeaders(),
        params
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getCarMakers(params: FilterParams): Observable<DataResult<CarMakersTable>> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.get<DataResult<CarMakersTable>>(
      `${this.centralRestServerServiceSecuredURL}/CarMakers`,
      {
        headers: this.buildHttpHeaders(),
        params
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public synchronizeCarsCatalog(): Observable<ActionsResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionsResponse>(`${this.centralRestServerServiceSecuredURL}/SynchronizeCarCatalogs`, {},
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createCar(car: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/CarCreate`, car,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateChargingStationOCPPConfiguration(id: string, chargerParameter: KeyValue): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    const body = `{
      "chargeBoxID": "${id}",
      "args": {
        "key": "${chargerParameter.key}",
        "value": "${chargerParameter.value}"
      }
    }`;
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationChangeConfiguration`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getChargingStationCompositeSchedule(id: string, connectorId: number, duration: number, unit: string):
    Observable<GetCompositeScheduleCommandResult | GetCompositeScheduleCommandResult[]> {
    // Verify init
    this.checkInit();
    // build request
    const body =
      `{
        "chargeBoxID": "${id}",
        "args": {
          "connectorId": ${connectorId},
          "duration": ${duration},
          "chargingRateUnit": "${unit}"
        }
      }`;
    // Execute
    return this.httpClient.post<GetCompositeScheduleCommandResult | GetCompositeScheduleCommandResult[]>(
      `${this.centralRestServerServiceSecuredURL}/ChargingStationGetCompositeSchedule`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationLimitPower(charger: ChargingStation, chargePoint: ChargePoint, connectorId?: number, ampLimitValue: number = 0, forceUpdateChargingPlan: boolean = false): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute
    return this.httpClient.put<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationLimitPower`, {
      chargeBoxID: charger.id,
      chargePointID: chargePoint.chargePointID,
      connectorId,
      ampLimitValue,
      forceUpdateChargingPlan,
    },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationSetChargingProfile(charger: ChargingStation, connectorId: number, chargingProfile: any): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Build default charging profile json
    let body: string;
    body = `{
      "chargeBoxID": "${charger.id}",
      "args": {
        "connectorId": 0,
        "csChargingProfiles": ${JSON.stringify(chargingProfile)}
      }
    }`;
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationSetChargingProfile`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationUpdateFirmware(charger: ChargingStation, locationURL: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    const date = new Date().toISOString();
    const body = (
      `{
        "chargeBoxID": "${charger.id}",
        "args": {
          "location": "${locationURL}",
          "retries": 0,
          "retrieveDate": "${date}",
          "retryInterval": 0
        }
      }`
    );
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/ChargingStationUpdateFirmware`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public chargingStationChangeAvailability(id: string, available: boolean, connectorID: number = 0): Observable<ActionResponse> {
    return this.actionChargingStation(
      ServerAction.CHARGING_STATION_CHANGE_AVAILABILITY, id, JSON.stringify({
        connectorId: connectorID,
        type: available ? OCPPAvailabilityType.OPERATIVE : OCPPAvailabilityType.INOPERATIVE,
      })
    );
  }

  public chargingStationReset(id: string, hard: boolean = true): Observable<ActionResponse> {
    return this.actionChargingStation(
      ServerAction.CHARGING_STATION_RESET, id, JSON.stringify({ type: hard ? 'Hard' : 'Soft' }));
  }

  public chargingStationClearCache(id: string): Observable<ActionResponse> {
    return this.actionChargingStation(ServerAction.CHARGING_STATION_CLEAR_CACHE, id, '');
  }

  public actionChargingStation(action: string, id: string, args: string): Observable<ActionResponse> {
    // Verify init
    this.checkInit();
    // Execute the REST service
    const body = (args ?
      `{
        "chargeBoxID": "${id}",
        "args": ${args}
      }` :
      `{
        "chargeBoxID": "${id}"
      }`
    );
    // Execute
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/${action}`, body,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public requestChargingStationOcppParameters(id: string) {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(
      `${this.centralRestServerServiceSecuredURL}/ChargingStationRequestOcppParameters`,
      {
        chargeBoxID: id,
        forceUpdateOCPPParamsFromTemplate: false,
      },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public updateChargingStationOCPPParamWithTemplate(id: string) {
    // Verify init
    this.checkInit();
    // Execute the REST service
    return this.httpClient.post<ActionResponse>(
      `${this.centralRestServerServiceSecuredURL}/ChargingStationRequestOcppParameters`,
      {
        chargeBoxID: id,
        forceUpdateOCPPParamsFromTemplate: true,
      },
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public getIntegrationConnections(userId: string): Observable<DataResult<IntegrationConnection>> {
    this.checkInit();
    return this.httpClient.get<DataResult<IntegrationConnection>>(`${this.centralRestServerServiceSecuredURL}/IntegrationConnections?userId=${userId}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public createIntegrationConnection(connection: UserConnection) {
    this.checkInit();
    return this.httpClient.post<ActionResponse>(`${this.centralRestServerServiceSecuredURL}/IntegrationConnectionCreate`, connection,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  public deleteIntegrationConnection(id: string): Observable<ActionResponse> {
    this.checkInit();
    return this.httpClient.delete<ActionResponse>(
      `${this.centralRestServerServiceSecuredURL}/IntegrationConnectionDelete?ID=${id}`,
      {
        headers: this.buildHttpHeaders(),
      })
      .pipe(
        catchError(this.handleHttpError),
      );
  }

  private checkInit(): void {
    // initialized?
    if (!this.initialized) {
      // No: Process the init
      // Get the server config
      this.centralSystemServerConfig = this.configService.getCentralSystemServer();
      // Build Central Service URL
      this.centralRestServerServiceBaseURL = this.centralSystemServerConfig.protocol + '://' +
        this.centralSystemServerConfig.host + ':' + this.centralSystemServerConfig.port;
      // Set REST base URL
      this.centralServerNotificationService.setcentralRestServerServiceURL(this.centralRestServerServiceBaseURL);
      // Auth API
      this.centralRestServerServiceAuthURL = this.centralRestServerServiceBaseURL + '/client/auth';
      // Secured API
      this.centralRestServerServiceSecuredURL = this.centralRestServerServiceBaseURL + '/client/api';
      // Util URL
      this.centralRestServerServiceUtilURL = this.centralRestServerServiceBaseURL + '/client/util';
      // Init Socket IO if user already logged
      if (this.configService.getCentralSystemServer().socketIOEnabled && this.getLoggedUser() && this.isAuthenticated()) {
        this.centralServerNotificationService.initSocketIO(this.getLoggedUserToken());
      }
      // Done
      this.initialized = true;
    }
  }

  private buildHttpHeaders(tenant?: string): HttpHeaders {
    const header = {
      'Content-Type': 'application/json'
    };
    if (tenant !== undefined) {
      header['Tenant'] = tenant;
    }
    // Check token
    if (this.getLoggedUserToken()) {
      header['Authorization'] = 'Bearer ' + this.getLoggedUserToken();
    }
    // Build Header
    return new HttpHeaders(header);
  }

  private getSorting(ordering: Ordering[], queryParams: FilterParams) {
    // Check
    if (ordering && ordering.length) {
      const sortFields: string[] = [];
      const sortDirs: string[] = [];
      ordering.forEach((order) => {
        sortFields.push(order.field);
        sortDirs.push(order.direction);
      });
      queryParams['SortFields'] = sortFields;
      queryParams['SortDirs'] = sortDirs;
    }
  }

  private getPaging(paging: Paging, queryParams: FilterParams) {
    // Limit
    if (paging.limit) {
      queryParams['Limit'] = paging.limit.toString();
    }
    // Skip
    if (paging.skip) {
      queryParams['Skip'] = paging.skip.toString();
    }
  }

  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    // In a real world app, we might use a remote logging infrastructure
    const errMsg = { status: 0, message: '', details: undefined };
    if (error) {
      errMsg.status = error.status;
      errMsg.message = error.message ? error.message : error.toString();
      errMsg.details = error.error;
    }
    return throwError(errMsg);
  }
}
