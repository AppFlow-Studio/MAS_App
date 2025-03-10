import z from 'zod';

const phoneNumberRegexp = new RegExp(
    /^[\+]?([0-9][\s]?|[0-9]?)([(][0-9]{3}[)][\s]?|[0-9]{3}[-\s\.]?)[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
  );
const FIELD_REQUIRED_STR = 'This field is required';

export const NameQuestionsSchema = z.object({
    first_name: z
      .string({
        invalid_type_error: 'Name must be a string',
        required_error: FIELD_REQUIRED_STR,
      })
      .min(3, 'Minimum 3 characters')
      .trim(),
      last_name: z
      .string({
        invalid_type_error: 'Name must be a string',
        required_error: FIELD_REQUIRED_STR,
      })
      .min(3, 'Minimum 3 characters')
      .trim(),
})

export type NameQuestionsSchema = z.infer<typeof NameQuestionsSchema>;
