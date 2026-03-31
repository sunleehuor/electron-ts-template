export type TRequestMethod = 'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';

export enum StateStatus {
  none = 'none',
  initial = 'initial',
  loading = 'loading',
  failure = 'failure',
  empty = 'empty',
  success = 'success',
  noInternet = 'noInternet',
  connected = 'connected',
  disConnected = 'disconnected',
  joining = 'joining',
  joined = 'joined',
  join_fail = 'join_fail',
  reconnect = 'reconnect',
  reconnecting = 'reconnecting',
  reconnect_fail = 'reconnect_fail',
  canceled = 'canceled',
}

export interface IRequestReturn<R, P> {
  status: StateStatus;
  data: R | undefined;
  request: (v: P) => Promise<void>;
  message: string | undefined;
  code: number | string | undefined;
  payload: P | undefined;
  refresh: (v?: P) => Promise<void>;
}
