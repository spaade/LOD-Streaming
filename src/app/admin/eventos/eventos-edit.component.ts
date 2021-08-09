import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UiService} from 'src/services/ui.service';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from 'src/services/auth.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {DataCompaniesService} from '../../../services/data.companies.service';
import {ActivatedRoute} from '@angular/router';
import {LodEvent} from '../../../models/lodEvent.model';
import {DataEventsService} from '../../../services/data.events.service';
import {LodStream} from '../../../models/lodStream.model';
import {LodSelfSubscription} from '../../../models/lodSelfSubscription.model';

@Component({
  selector: 'app-admin-eventos-edit',
  templateUrl: './eventos-edit.component.html',
})
export class AdminEventosEditComponent implements OnInit {

  public editingItem: LodEvent = new LodEvent();

  flagSavingData = false;

  flagLoadingItem = false;

  cadastroForm: FormGroup;

  streams: FormArray;

  selfSubscriptionOptions: LodSelfSubscription[];
  flagAllowSelfSubscription;

  tzOffSet = new Date().getTimezoneOffset() * 60000;

  get flagLoadingData() {

    return this.appDataEvents.flagLoadingData;
  }

  //region Form Getters

  get eventName() {
    return this.cadastroForm.get('eventName');
  }

  get eventDescription() {
    return this.cadastroForm.get('eventDescription');
  }

  get startDate() {
    return this.cadastroForm.get('startDate');
  }

  get endDate() {
    return this.cadastroForm.get('endDate');
  }

  get logoImgUrl() {
    return this.cadastroForm.get('logoImgUrl');
  }

  get homeBgImgUrl() {
    return this.cadastroForm.get('homeBgImgUrl');
  }

  get loginImgUrl() {
    return this.cadastroForm.get('loginImgUrl');
  }

  get signUpImgUrl() {
    return this.cadastroForm.get('signUpImgUrl');
  }

  get homeBgColor() {
    return this.cadastroForm.get('homeBgColor');
  }

  get loginBgColor() {
    return this.cadastroForm.get('loginBgColor');
  }

  get signUpBgColor() {
    return this.cadastroForm.get('signUpBgColor');
  }

  get homeColor() {
    return this.cadastroForm.get('homeColor');
  }

  get signUpColor() {
    return this.cadastroForm.get('signUpColor');
  }

  get loginColor() {
    return this.cadastroForm.get('loginColor');
  }

  get streamControls() {
    return this.cadastroForm.get('streams')['controls'];
  }

  //endregion

  constructor(
    private appUi: UiService,
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataEvents: DataEventsService,
    public appDataCompanies: DataCompaniesService,
    private activatedRoute: ActivatedRoute,
  ) {

    this.selfSubscriptionOptions = [
      {option: 'Nome', isNeeded: true},
      {option: 'Cargo', isNeeded: true},
      {option: 'Filial', isNeeded: true},
      {option: 'Telefone', isNeeded: true}
    ];

    this.cadastroForm = new FormGroup({
      eventName: new FormControl('', Validators.required),
      eventDescription: new FormControl('', Validators.required),
      startDate: new FormControl('', Validators.required),
      endDate: new FormControl('', Validators.required),

      logoImgUrl: new FormControl(''),

      homeBgImgUrl: new FormControl(''),
      loginImgUrl: new FormControl(''),
      signUpImgUrl: new FormControl(''),

      homeColor: new FormControl(''),
      loginColor: new FormControl(''),
      signUpColor: new FormControl(''),

      homeBgColor: new FormControl(''),
      loginBgColor: new FormControl(''),
      signUpBgColor: new FormControl(''),

      streams: this.fb.array([])
    });

  }

  async ngOnInit() {

    this.activatedRoute.paramMap.subscribe((data: any) => {

      this.loadEditingItem(data.params.eventId);
    });

    let params: any = document.location.search;

    if (params) {

      params = params.split('=');

      if (params.length > 1 && params[0].includes('active')) {

        this.cadastroForm.get('active').setValue(params[1]);
      }
    }

    try {
      document.getElementById('txtEventName').focus();
    } catch (err) {
    }

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }

  addStream(srcObj?: any) {

    this.streams = this.cadastroForm.get('streams') as FormArray;
    this.streams.push(this.createStream(srcObj));
  }

  removeStream(i) {

    this.streams.removeAt(i);
  }

  createStream(srcObj?: any) {

    if(srcObj) {
      if (srcObj.enabledFromDate && srcObj.enabledFromDate && srcObj.enabledFromDate != 0 || null) {

        let newEnabledFromDate = new Date(srcObj.enabledFromDate - this.tzOffSet).toISOString().substr(0, 16);
        let newRunningFromDate = new Date(srcObj.runningFromDate - this.tzOffSet).toISOString().substr(0, 16);
        let newRunningToDate = new Date(srcObj.runningToDate - this.tzOffSet).toISOString().substr(0, 16);

        console.log(newEnabledFromDate)

        return this.fb.group({
          streamName: new FormControl(srcObj?.streamName),
          streamStatus: new FormControl(srcObj?.streamStatus),

          requiresAgreement: new FormControl(srcObj?.requiresAgreement),
          agreementUrl: new FormControl(srcObj?.agreementUrl),

          streamVimeoUrl: new FormControl(srcObj?.streamVimeoUrl),
          socialMediaUrl: new FormControl(srcObj?.socialMediaUrl),

          enabledFromDate: new FormControl(new Date(newEnabledFromDate)),
          runningFromDate: new FormControl(new Date(newRunningFromDate)),
          runningToDate: new FormControl(new Date(newRunningToDate)),
        });

      } else {

        return this.fb.group({
          streamName: new FormControl(srcObj?.streamName),
          streamStatus: new FormControl(srcObj?.streamStatus),

          requiresAgreement: new FormControl(srcObj?.requiresAgreement),
          agreementUrl: new FormControl(srcObj?.agreementUrl),

          streamVimeoUrl: new FormControl(srcObj?.streamVimeoUrl),
          socialMediaUrl: new FormControl(srcObj?.socialMediaUrl),

          enabledFromDate: new FormControl(),
          runningFromDate: new FormControl(),
          runningToDate: new FormControl()
        });

      }

    } else {

      return this.fb.group({
        streamName: new FormControl(srcObj?.streamName),
        streamStatus: new FormControl(srcObj?.streamStatus),

        requiresAgreement: new FormControl(srcObj?.requiresAgreement),
        agreementUrl: new FormControl(srcObj?.agreementUrl),

        streamVimeoUrl: new FormControl(srcObj?.streamVimeoUrl),
        socialMediaUrl: new FormControl(srcObj?.socialMediaUrl),

        enabledFromDate: new FormControl(),
        runningFromDate: new FormControl(),
        runningToDate: new FormControl()
      });
    }

  }

  async loadEditingItem(itemId) {

    this.flagLoadingItem = true;

    let event = await this.appDataEvents.getEvent(this.appDataCompanies.selectedCompanyId, itemId);

    this.editingItem = new LodEvent(event);

    let newStartDate = new Date(this.editingItem.startDate - this.tzOffSet).toISOString().substr(0, 16);
    let newEndDate = new Date(this.editingItem.endDate - this.tzOffSet).toISOString().substr(0, 16);

    this.cadastroForm.patchValue({
      eventName: this.editingItem.eventName,
      eventDescription: this.editingItem.eventDescription,

      logoImgUrl: this.editingItem.logoImgUrl,
      homeBgImgUrl: this.editingItem.homeBgImgUrl,
      loginImgUrl: this.editingItem.logoImgUrl,
      signUpImgUrl: this.editingItem.signUpBgImgUrl,

      homeColor: this.editingItem.homeColor,
      loginColor: this.editingItem.loginColor,
      signUpColor: this.editingItem.signUpColor,

      homeBgColor: this.editingItem.homeBgColor,
      loginBgColor: this.editingItem.loginBgColor,
      signUpBgColor: this.editingItem.signUpBgColor
    });

    for (let i = 0; i < this.editingItem.streams.length; i++) {

      this.addStream(this.editingItem.streams[i]);

    }

    if (this.editingItem.startDate && this.editingItem.endDate != 0 || null) {

      this.cadastroForm.patchValue({
        startDate: new Date(newStartDate),
        endDate: new Date(newEndDate)
      });

    } else {

      this.editingItem.startDate = 0;
      this.editingItem.endDate = 0;

    }

    this.flagLoadingItem = false;

  }

  sendForm() {

    this.cadastroForm.markAllAsTouched();

    if (this.cadastroForm.valid) {

      this.flagSavingData = true;

      window.setTimeout(async () => {

        let newEvent = {
          companyId: this.appDataCompanies.selectedCompanyId,
          eventName: this.eventName.value,
          eventDescription: this.eventDescription.value,
          startDate: new Date(this.startDate.value).getTime(),
          endDate: new Date(this.endDate.value).getTime(),

          logoImgUrl: this.logoImgUrl.value,

          homeBgImgUrl: this.homeBgImgUrl.value,
          loginImgUrl: this.logoImgUrl.value,
          signUpImgUrl: this.signUpImgUrl.value,

          homeColor: this.homeColor.value,
          loginColor: this.loginColor.value,
          signUpColor: this.signUpColor.value,

          homeBgColor: this.homeBgColor.value,
          loginBgColor: this.loginBgColor.value,
          signUpBgColor: this.signUpBgColor.value,

          streams: []
        };

        for (let i = 0; i < this.streamControls.length; i++) {

          let newStream = {
            companyId: this.appDataCompanies.selectedCompanyId,
            eventId: this.editingItem.id,
            createdUserId: this.appAuth.userId,

            streamName: this.streamControls[i].value.streamName,
            requiresAgreement: this.streamControls[i].value.requiresAgreement,
            agreementUrl: this.streamControls[i].value.agreementUrl,
            streamVimeoUrl: this.streamControls[i].value.streamVimeoUrl,
            socialMediaUrl: this.streamControls[i].value.socialMediaUrl,

            enabledFromDate: new Date(this.streamControls[i].value.enabledFromDate).getTime(),
            runningFromDate: new Date(this.streamControls[i].value.runningFromDate).getTime(),
            runningToDate: new Date(this.streamControls[i].value.runningToDate).getTime()
          };

          newEvent.streams.push(newStream);
        }


        if (this.editingItem && this.editingItem.id != '') {

          newEvent['id'] = this.editingItem.id;
        }

        let result = await this.appDataEvents.saveEvent(newEvent);

        if (!result.error) {

          this.appUi.showMsg('Dados salvos com sucesso!');


        } else {

          this.appUi.showMsg('Erro ao salvar dados!' + result.error);
        }

        this.flagSavingData = false;

      }, 1200);
    }
  }

}
