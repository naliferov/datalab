interface MetaData {
  i?: {
    id: string;
    t: string;
    openable?: boolean;
  };
}

interface DataMap extends MetaData {
  m: Record<string, DataEditorEntity | string>;
  o: string[];
}

interface DataList extends MetaData {
  l: string[];
}

interface DataValue extends MetaData {
  v: any;
}

export type DataEditorEntity = DataMap | DataList | DataValue;
