import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormControl, FormBuilder } from '@angular/forms';
import { CreateFormFields } from './field.interface';
import { CONFIG } from './app.config';
import { HttpClient } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    bufferSize = 300;
    numberOfItemsFromEndBeforeFetchingMore = 20;
    searchBoxGroup: FormGroup;
    searchBoxObj = {};
    searchBoxes = [];
    searchBoxConfig = CONFIG.search;
    isModalPopup = false;
    firstAPICalled = false;
    primaryData = {};
    dropDownRecords = [];
    ENCRYPT_KEY = {
        columnName: 'p1',
        conditions: 'p2',
        conditionColumnName: 'p21',
        conditionValue: 'p22',
        conditionTableName: 'p23',
        parentColumn: 'p24',
        tableName: 'p3',
        requestedColumnParentTable: 'p4',
        requestedColumnParentColumn: 'p5',
        foreginKeyTable: 'p23',
        foreginKeyColumn: 'p24'
    };

    constructor(
        private fb: FormBuilder,
        private http: HttpClient
    ) {}

    ngOnInit() {
        this.createSearchBoxes();
    }

    createSearchBoxes() {
        this.searchBoxGroup = this.createFormFields({
            fieldsArray: this.searchBoxConfig.fields,
            groupObj: this.fb.group({})
        }, this.isModalPopup);
        this.searchBoxConfig.fields.forEach((searchFieldRow, rowIndex) => {
            searchFieldRow.forEach(searchField => {
                if (!this.searchBoxes.includes(searchField.name)) {
                    this.searchBoxes.push(searchField.name);
                    this.searchBoxObj[searchField.name] = {
                        options: [],
                        optionBuffer: [],
                        filteredRecords: [],
                        filterValue: null,
                        apiReqObj: this.createReqObj(searchField),
                        selectFromList: false,
                        totalPage: 0,
                        currentPage: 0
                    };
                    if (!this.firstAPICalled && searchField.fieldType !== 'primary') {
                        this.firstAPICalled = true;
                        this.fillDropDown(this.searchBoxObj[searchField.name].apiReqObj);
                    }
                }
            });
        });
    }

    createFormFields(fieldConfig: CreateFormFields, applySearchValidation = false) {
        fieldConfig.fieldsArray.forEach(fieldsRow => {
            fieldsRow.forEach(field => {
                field.value = (fieldConfig.fieldValue && fieldConfig.fieldValue[field.valueKey]) || '';
                if (field.type === 'button' || field.type === 'blank') {
                    return;
                }
                if (field.type === 'select') {
                    field.options = (fieldConfig.masterData && fieldConfig.masterData[field.option]) || [];
                }
                if (!fieldConfig.groupObj.contains(field.name)) {
                    const control = this.fb.control(
                        field.value,
                        this.bindValidations(field[(applySearchValidation ? 'searchValidations' : 'validations')] || [])
                    );
                    fieldConfig.groupObj.addControl(field.name, control);
                } else {
                    fieldConfig.groupObj.get(field.name).setValue(field.value);
                }
            });
        });
        return fieldConfig.groupObj;
    }

    bindValidations(validations: any) {
        if (validations.length > 0) {
            const validList = [];
            validations.forEach(valid => {
                validList.push(valid.validator);
            });
            return Validators.compose(validList);
        }
        return null;
    }

    onOpen(select, fieldName) {
        this.filterRecords(select.filterValue, fieldName);
    }

    OnSearch(select, fieldName) {
        this.searchBoxGroup.get(fieldName).setValue(null);
        this.searchBoxObj[fieldName].filterValue = event['target']['value'];
        this.filterRecords(this.searchBoxObj[fieldName].filterValue, fieldName);
        select.searchTerm = this.searchBoxObj[fieldName].filterValue;
        select.filterValue = this.searchBoxObj[fieldName].filterValue;
    }

    filterRecords(searchTerm, fieldName) {
        if (searchTerm) {
            this.searchBoxObj[fieldName].filteredRecords = this.searchBoxObj[fieldName].optionBuffer.
                filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
            this.searchBoxObj[fieldName].filteredRecords = JSON.parse(JSON.stringify(this.searchBoxObj[fieldName].optionBuffer));
        }
    }

    changeFn(select, fieldObj) {
        this.searchBoxObj[fieldObj.name].filterValue = '';
        select.searchInput.nativeElement.value = select.selectedItems[0].value;
        this.searchBoxObj[fieldObj.name].selectFromList = false;
        this.optionSelected(select.selectedItems[0].value, fieldObj);
    }

    onBlur(select, fieldObj) {
        if (this.searchBoxObj[fieldObj.name].filterValue) {
            select.searchInput.nativeElement.value = this.searchBoxObj[fieldObj.name].filterValue;
            select.searchTerm = this.searchBoxObj[fieldObj.name].filterValue;
            const data = this.searchBoxObj[fieldObj.name].filteredRecords.
                filter(option => option === this.searchBoxObj[fieldObj.name].filterValue);
            if (data.length === 1) {
                // this.selectFromList = false;
                this.searchBoxObj[fieldObj.name].selectFromList = false;
                this.searchBoxGroup.get(fieldObj.name).setValue(data[0]);
                this.optionSelected(data[0], fieldObj);
            } else {
                this.searchBoxGroup.get(fieldObj.name).setValue(null);
            }
        }
        if (this.searchBoxObj[fieldObj.name].filteredRecords.length > 0 && !this.searchBoxGroup.value[fieldObj.name]) {
            // this.selectFromList = true;
            this.searchBoxObj[fieldObj.name].selectFromList = true;
        }
    }

    optionSelected(selectedItems, fieldObj) {
        this.searchBoxGroup.value[fieldObj.name] = selectedItems;
        if (fieldObj.childKey !== '') {
            const reqObj = JSON.parse(JSON.stringify(this.searchBoxObj[fieldObj.childKey].apiReqObj));
            reqObj.conditions.forEach(conditionObj => {
                conditionObj.conditionValue = this.searchBoxGroup.value[conditionObj.conditionColumnName];
            });
            this.fillDropDown(reqObj);
        }
        console.log('Option selected for = ', (fieldObj.name), 'with value = ', this.searchBoxGroup.get(fieldObj.name).value);
    }

    submit() { }


    onScrollToEnd(fieldName) {
        this.fetchMore(fieldName);
    }

    onScroll({ end }, fieldName) {
        if (this.searchBoxObj[fieldName].options.length <= this.searchBoxObj[fieldName].optionBuffer.length) {
            return;
        }

        if (end + this.searchBoxObj[fieldName].numberOfItemsFromEndBeforeFetchingMore >= this.searchBoxObj[fieldName].optionBuffer.length) {
            this.fetchMore(fieldName);
        }
    }

    private fetchMore(fieldName) {
        const len = this.searchBoxObj[fieldName].optionBuffer.length;
        const more = this.searchBoxObj[fieldName].options.slice(len, this.bufferSize + len);
        setTimeout(() => {
            this.searchBoxObj[fieldName].optionBuffer = this.searchBoxObj[fieldName].optionBuffer.concat(more);
            this.filterRecords(this.searchBoxObj[fieldName].filterValue, fieldName);
        }, 200);
    }

    createReqObj(searchField) {
        const reqObj: any = {
            tableName: this.searchBoxConfig.tblName,
            columnName: searchField.name,
            conditions: []
        };
        searchField.parentKeys.forEach((parentKey, index) => {
            const conditionObj: any = {};
            conditionObj.conditionColumnName = parentKey;
            conditionObj.conditionValue = this.searchBoxGroup.value[parentKey];
            if (searchField.childTableKey && searchField.childTableKey[index]) {
                conditionObj.conditionTableName = searchField.childTableKey[index];
            }
            if (searchField.parentColumn && searchField.parentColumn[index]) {
                conditionObj.parentColumn = searchField.parentColumn[index];
            }
            reqObj.conditions.push(conditionObj);
        });
        if (searchField && searchField.requestedColumnParentTable &&
            searchField.requestedColumnParentColumn) {
            reqObj.requestedColumnParentTable = searchField.requestedColumnParentTable;
            reqObj.requestedColumnParentColumn = searchField.requestedColumnParentColumn;
        }
        return reqObj;
    }

    fillDropDown(reqObj) {
        const reqObjClone = JSON.parse(JSON.stringify(reqObj));
        for (const key in this.primaryData) {
            if (this.primaryData.hasOwnProperty(key)) {
                reqObjClone.conditions.push({
                    conditionColumnName: key,
                    conditionValue: this.primaryData[key]
                });
            }
        }
        if (this.dropDownRecords.length > 0) {
            // Fill dropdown options from the available records
            this.getOptions(reqObjClone).then(options => {
                this.searchBoxObj[reqObj.columnName].options = options;
            });
        } else {
            // Fill dropdown options using API response
            this.fillDropDownOption(reqObjClone).toPromise().then(options => {
                this.searchBoxObj[reqObj.columnName].options = options;
                this.searchBoxObj[reqObj.columnName].optionBuffer = this.searchBoxObj[reqObj.columnName].options.splice(0, this.bufferSize);
            }).catch(err => {
                this.searchBoxObj[reqObj.columnName].options = [];
            });
        }
    }

    fillDropDownOption(reqObj) {
        return this.http.post('http://oddev.westus.cloudapp.azure.com:8081' + '/commons/_dropdown-options',
            this.renameKeys(this.ENCRYPT_KEY, reqObj));
    }

    renameKeys(keysMap, obj) {
        return Object.keys(obj).reduce((acc, key) => {
            if (Array.isArray(obj[key])) {
                obj[key].forEach((childObj, index) => {
                    obj[key][index] = this.renameKeys(keysMap, childObj);
                });
            } else if (typeof obj[key] === 'object') {
                obj[key] = this.renameKeys(keysMap, obj[key]);
            } else if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
                obj[key] = this.encryptText(obj[key]);
            }
            const renamedObject = {
                [keysMap[key] || key]: obj[key]
            };
            return {
                ...acc,
                ...renamedObject
            };
        }, {});
    }

    encryptText(plainText: string) {
        const initVector = CryptoJS.enc.Utf8.parse('FLvEHyF7qY6meHAU');
        const keyUtf8 = CryptoJS.enc.Utf8.parse('7Zk9ImH5C4W8A1MP');
        const t = CryptoJS.AES.encrypt(plainText, keyUtf8, {
            iv: initVector
        });
        return t.ciphertext.toString(CryptoJS.enc.Base64);
    }

    getOptions(reqObjClone) {
        return new Promise((resolve, reject) => {
            try {
                const options = [];
                this.dropDownRecords.forEach((record, index) => {
                    let conditionTrue = 0;
                    reqObjClone.conditions.forEach(condition => {
                        const columnName = condition.conditionColumnName;
                        const columnValue = condition.conditionValue;
                        if (record[columnName] === columnValue) {
                            conditionTrue++;
                        }
                        if (reqObjClone.conditions.length === conditionTrue) {
                            options.push(record[reqObjClone.columnName]);
                        }
                        if (index === (this.dropDownRecords.length - 1)) {
                            resolve(options);
                        }
                    });
                });
            } catch (error) {
                resolve([]);
            }
        });
    }

}
