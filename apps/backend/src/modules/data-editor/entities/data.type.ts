interface MetaType {
  i?: {
    id: string;
    t: string;
    openable?: boolean;
  };
}

export interface PlainType extends MetaType {
  v: undefined | null | boolean | number | string;
}

export interface MapType extends MetaType {
  m: Record<string, DataType | string>;
  o: string[];
}

export interface ListType extends MetaType {
  l: string[];
}

export type DataType = PlainType | MapType | ListType;
