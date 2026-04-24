import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneField', async: false })
export class AtLeastOneField implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as Record<string, any>;

    return args.constraints.some(field =>
      typeof field === 'string' ? obj[field] !== undefined : false
    );
  }

  defaultMessage(): string {
    return 'At least one of the following fields must be provided: age, description';
  }
}
