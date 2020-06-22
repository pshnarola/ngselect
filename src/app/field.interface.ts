import { FormGroup } from '@angular/forms';

export interface FieldConfig {
    label: string;
    name: string;
    value?: any;
    valueKey: string;
    type: string;
    inputType?: string;
    inputMaskType?: string;
    option?: string;
    options?: string[];
    isEditable?: boolean;
    width?: string;
    validations?: [];
    fieldType: any;
    recordExists?: string;
}

export interface CreateFormFields {
    fieldsArray: any[];
    masterData?: {};
    groupObj: FormGroup;
    fieldValue?: {};
}
