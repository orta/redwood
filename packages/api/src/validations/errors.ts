import { RedwoodError } from '../errors'

export class ServiceValidationError extends RedwoodError {
  constructor(message: string, substitutions = {}) {
    let errorMessage = message

    // replace instances of a string like `{max}` with any substituted values
    for (const [key, value] of Object.entries(substitutions)) {
      errorMessage = errorMessage.replaceAll(`\${${key}}`, String(value))
    }

    super(errorMessage)
    this.name = 'ServiceValidationError'
  }
}

export class AbsenceValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} is not absent',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'AbsenceValidationError'
  }
}

export class AcceptanceValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be accepted',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'AcceptanceValidationError'
  }
}

export class EmailValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be formatted like an email address',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'EmailValidationError'
  }
}

export class ExclusionValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} is reserved',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'ExclusionValidationError'
  }
}

export class FormatValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} is not formatted correctly',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'FormatValidationError'
  }
}

export class InclusionValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} is reserved',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'InclusionValidationError'
  }
}

export class MinLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must have at least ${min} characters',
    substitutions: { min?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'MinLengthValidationError'
  }
}

export class MaxLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must have no more than ${max} characters',
    substitutions: { max?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'MaxLengthValidationError'
  }
}

export class EqualLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must have exactly ${equal} characters',
    substitutions: { equal?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'EqualLengthValidationError'
  }
}

export class BetweenLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be between ${min} and ${max} characters',
    substitutions: { min?: number; max?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'BetweenLengthValidationError'
  }
}

export class PresenceValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be present',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'PresenceValidationError'
  }
}

export class TypeNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must by a number',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'TypeNumericalityValidationError'
  }
}

export class IntegerNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be an integer',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'IntegerNumericalityValidationError'
  }
}

export class LessThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be less than ${lessThan}',
    substitutions: { lessThan?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'LessThanNumericalityValidationError'
  }
}

export class LessThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be less than or equal to ${lessThanOrEqual}',
    substitutions: { lessThanOrEqual?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'LessThanOrEqualNumericalityValidationError'
  }
}

export class GreaterThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be greater than ${greaterThan}',
    substitutions: { greaterThan?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'GreaterThanNumericalityValidationError'
  }
}

export class GreaterThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be greater than or equal to ${greaterThanOrEqual}',
    substitutions: { greaterThanOrEqual?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'GreaterThanOrEqualNumericalityValidationError'
  }
}

export class EqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must equal ${equal}',
    substitutions: { equal?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'EqualNumericalityValidationError'
  }
}

export class OtherThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must not equal ${otherThan}',
    substitutions: { otherThan?: number } = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'OtherThanNumericalityValidationError'
  }
}

export class EvenNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be even',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'EvenNumericalityValidationError'
  }
}

export class OddNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be odd',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'OddNumericalityValidationError'
  }
}

export class PositiveNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be positive',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'PositiveNumericalityValidationError'
  }
}

export class NegativeNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    message = '${name} must be negative',
    substitutions = {}
  ) {
    super(message, Object.assign(substitutions, { name }))
    this.name = 'NegativeNumericalityValidationError'
  }
}

export class UniquenessValidationError extends ServiceValidationError {
  constructor(name: string, message: string | undefined, _substitutions = {}) {
    const errorMessage = message ? message : `${name} must be unique`

    super(errorMessage)
    this.name = 'UniquenessValidationError'
  }
}
