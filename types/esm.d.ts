declare interface IProgress {
  header?: string,
  percent?: number | null,
  custom?: string,
  footer?: string
}

declare interface ICallback{
  keepalive?: number,
  onActivated?(): void,
  onDismissed?(reason: string | number): void
}

declare interface IGroup{
  id: string,
  title: string
}

declare interface IButton{
  text : string, 
  onClick : string, 
  contextMenu ?: boolean, 
  icon ?: string
}

declare interface IOption {
  disableWinRT?: bool,
  usePowerShellCore?: bool,
  appID?: string,
  uniqueID?: string | null,
  sequenceNumber?: number,
  title?: string,
  message?: string,
  attribution?: string,
  icon?: string,
  cropIcon?: bool,
  headerImg?: string,
  footerImg?: string,
  silent?: bool,
  hide?: bool,
  audio?: string,
  longTime?: bool,
  onClick?: string,
  scenario?: string,
  timeStamp?: number | string,
  button?: IButton[],
  group?: IGroup | null,
  progress?: IProgress,
  callback?: ICallback 
}

export default function (option?: IOption): Promise<any>;
export isWinRTAvailable: bool;

declare interface IToastProperties {
  expirationTime: string,
  tag: string,
  group: string,
  remoteID: string | null,
  suppressPopup: bool,
  mirroringAllowed: bool,
  expiresOnReboot: bool,
  highPriority: bool,
  status: string | null
}

export function remove(appID: string, uniqueID?: string | string[] | null): Promise<any>;
export function getHistory(appID: string): Promise<IToastProperties[]>;