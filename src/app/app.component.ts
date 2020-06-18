import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    productData: any[] = [
        {
            id: 222,
            name: 'production1'
        },
        {
            id: 3356,
            name: 'production2'
        },
        {
            id: 8085,
            name: 'production3'
        },
        {
            id: 3946,
            name: 'production4'
        },
        {
            id: 3140,
            name: 'production5'
        },
        {
            id: 3681,
            name: 'production6'
        },
        {
            id: 1,
            name: 'Pankti'
        },
        {
            id: 2,
            name: 'user'
        }
    ];
    productForm: FormGroup;
    filterValue: any;
    filteredRecords = [];
    selectFromList = false;

    constructor() {
        this.filteredRecords = JSON.parse(JSON.stringify(this.productData));
    }

    ngOnInit() {
        this.productForm = new FormGroup({
            prodCode: new FormControl(null, Validators.required),
        });
    }

    onOpen(select) {
        this.filterRecords(select.filterValue);
    }

    OnSearch(select, fieldName) {
        this.productForm.get(fieldName).setValue(null);
        this.filterValue = event['target']['value'];
        this.filterRecords(this.filterValue);
        select.searchTerm = this.filterValue;
        select.filterValue = this.filterValue;
    }

    filterRecords(searchTerm) {
        if (searchTerm) {
            this.filteredRecords = this.productData.filter(state => state.name.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
            this.filteredRecords = JSON.parse(JSON.stringify(this.productData));
        }
    }

    changeFn(select, fieldName) {
        this.filterValue = '';
        select.searchTerm = select.selectedItems[0].label;
        select.filterValue = select.selectedItems[0].label;
        this.selectFromList = false;
        this.optionSelected(fieldName);
    }

    onBlur(select, fieldName) {
        if (this.filterValue) {
            const data = this.filteredRecords.filter(state => state.name === this.filterValue);
            if (data.length === 1) {
                this.selectFromList = false;
                this.productForm.get(fieldName).setValue(data[0].id);
                this.optionSelected(fieldName);
            } else {
                select.searchTerm = this.filterValue;
                this.productForm.get(fieldName).setValue(null);
            }
        }
        if (this.filteredRecords.length > 0 && !this.productForm.value[fieldName]) {
            this.selectFromList = true;
        }
    }

    optionSelected(fieldName) {
        console.log('Option selected for = ', (fieldName), 'with value = ', this.productForm.get(fieldName).value);
    }

    submit() {
        this.validateAllFormFields(this.productForm);
    }

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }
}
