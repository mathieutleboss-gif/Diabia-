declare module "papaparse" {
  export type ParseResult<T> = {
    data: T[];
    errors: Array<{ message: string }>;
    meta: Record<string, unknown>;
  };

  export type ParseConfig<T> = {
    header?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error, file: File) => void;
  };

  const Papa: {
    parse<T = Record<string, unknown>>(
      file: File,
      config: ParseConfig<T>
    ): void;
  };

  export default Papa;
}
