export const CONFIG = {
    search: {
        tblName: 'material',
        editExternal: false,
        recordExists: 'SUB_LOCATIONS_ALREADY_EXISTS',
        fields: [
            [
                {
                    label: 'MATERIAL.FIELDS.MATNO',
                    name: 'matNo',
                    value: '',
                    valueKey: 'matNo',
                    childKey: '',
                    parentKeys: [],
                    type: 'input',
                    inputType: 'text',
                    fieldType: '',
                    option: '',
                    notExistsLabel: 'MATERIAL_DOES_NOT_EXISTS',
                    validations: [
                    ]
                }
            ]
        ]
    }
};



// [
//     {
//         label: 'Plant',
//         name: 'plant',
//         value: '',
//         valueKey: 'plant',
//         childKey: 'sloc',
//         parentKeys: [],
//         type: 'input',
//         inputType: 'text',
//         fieldType: '',
//         option: '',
//         notExistsLabel: 'LOCATION_NOT_FOUND',
//         validations: []
//     },
//     {
//         label: 'Sub location',
//         name: 'sloc',
//         value: '',
//         valueKey: 'sloc',
//         childKey: '',
//         parentKeys: ['plant'],
//         childTableKey: [],
//         fieldType: '',
//         parentColumn: [],
//         type: 'input',
//         inputType: 'text',
//         option: '',
//         notExistsLabel: 'LOCATION_NOT_FOUND',
//         validations: []
//     }
// ]
