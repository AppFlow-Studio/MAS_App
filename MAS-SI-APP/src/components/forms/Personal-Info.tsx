import z from 'zod';

const phoneNumberRegexp = new RegExp(
  /^[\+]?([0-9][\s]?|[0-9]?)([(][0-9]{3}[)][\s]?|[0-9]{3}[-\s\.]?)[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
);
const FIELD_REQUIRED_STR = 'This field is required';

export const submissionFormSchema = z.object({
    name: z
      .string({
        invalid_type_error: 'Name must be a string',
        required_error: FIELD_REQUIRED_STR,
      })
      .min(2, 'Minimum 2 characters')
      .max(50, 'Maximum 50 characters')
      .trim(),

    phoneNumber: z
    .string({
      invalid_type_error: 'Phone number must be a number',
      required_error: FIELD_REQUIRED_STR,
    })
    .regex(phoneNumberRegexp, 'Invalid phone number'),

    email: z
    .string({
      invalid_type_error: 'Email must be a string',
      required_error: FIELD_REQUIRED_STR,
    })
    .email('Email is invalid'),

    
})


export const businessInfoSubmissions = z.object({
    businessName: z
      .string({
        invalid_type_error: 'Name must be a string',
        required_error: FIELD_REQUIRED_STR,
      })
      // .min(3, 'Minimum 3 characters')
      // .max(20, 'Maximum 20 characters')
      .trim(),

    businessPhoneNumber: z
    .string({
      invalid_type_error: 'Phone number must be a number',
      required_error: FIELD_REQUIRED_STR,
    })
    .regex(phoneNumberRegexp, 'Invalid phone number'),

    businessEmail: z
    .string({
      invalid_type_error: 'Email must be a string',
      required_error: FIELD_REQUIRED_STR,
    })
    .email('Email is invalid'),

    city : z.string({
        invalid_type_error: 'City must be a string',
        required_error: FIELD_REQUIRED_STR,
    }).min(2, 'Minimum 2 characters')
    .max(50, 'Maximum 50 characters')
    .trim(),

    state : z.string({
        invalid_type_error: 'State must be a string',
        required_error: FIELD_REQUIRED_STR,
    })
    // .min(3, 'Minimum 3 characters')
    // .max(20, 'Maximum 20 characters')
    .trim(),

    address : z.string({
        invalid_type_error: 'Address must be a string',
        required_error: FIELD_REQUIRED_STR,
    }).min(5, 'Minimum 5 characters')
    .max(100, 'Maximum 100 characters')
    .trim(),

})

export type SubmissionFormSchema = z.infer<typeof submissionFormSchema>;

export type BusinessInfoSchema = z.infer<typeof businessInfoSubmissions>;