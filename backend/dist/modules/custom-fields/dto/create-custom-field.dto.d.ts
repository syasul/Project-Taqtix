export declare class CreateCustomFieldDto {
    label: string;
    fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
    options?: string[];
    required?: boolean;
    order?: number;
}
