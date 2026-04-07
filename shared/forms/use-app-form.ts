import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";

export const useAppForm = <TFieldValues extends FieldValues>(
  schema: Parameters<typeof zodResolver>[0],
  options: Omit<UseFormProps<TFieldValues>, "resolver"> & {
    readonly defaultValues: DefaultValues<TFieldValues>;
  },
): UseFormReturn<TFieldValues> => {
  return useForm<TFieldValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    ...options,
    resolver: zodResolver(schema) as Resolver<TFieldValues>,
  });
};
