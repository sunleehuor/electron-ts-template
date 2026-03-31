import axiosInstance from '@/data/libs/request/axios';
import { StateStatus, type TRequestMethod } from '@/data/types/request';
import axios from 'axios';
import { useEffect, useMemo, useReducer, useRef } from 'react';

export interface IRequestFilter extends IRequestPagination {}

export interface IRequestPagination {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'desc' | 'asc';
}

export interface IRequestReturnMeta {
  allpage: number;
  total: number;
  current_page: number;
  limit: number;
}

export interface IUseRequestProps {
  method: TRequestMethod;
  url: string;
}

export interface IUseRequestPayload<P, PG = IRequestPagination> {
  data?: P;
  params?: IRequestPagination & PG;
  query?: Record<string, any>;
  headers?: Record<string, any>;
}

export interface IRequestResponse<R, P, PG = IRequestPagination> {
  request: (v?: IUseRequestPayload<P, PG>) => Promise<any>;
  refresh: () => Promise<any>;
  reset: () => Promise<void>;
  clear: () => Promise<void>;
  onNextPage: () => void;
  onPrePage: () => void;
  changeLimit: (l: number) => void;
  onSearch: (q: string | undefined, keys?: any, p?: PG & IRequestPagination) => void;
  getFilter: () => IRequestPagination;
  state: IReducerState<R, P, PG>;
  setPayload: (p: IUseRequestPayload<P, PG>) => void;
  cancel: () => void;
}

function getFullUrl(link: string, v: Record<string, any>): string {
  let url = link;
  Object.entries(v).forEach(([key, value]) => {
    url = url.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return url;
}

// Default Value
const DEFAULT_LIMIT = 30;
const DEFAULT_PAGE = 1;

interface IReducerState<RESPONSE, PAYLOAD, PAGINATION = IRequestPagination> {
  status: StateStatus;
  data: RESPONSE;
  dataPersist: RESPONSE;
  message: string;
  code: number;
  payload: IUseRequestPayload<PAYLOAD, PAGINATION & IRequestPagination>;
  meta: IRequestReturnMeta | undefined;
  pagination: IRequestPagination;
  isSuccess: boolean;
  isFail: boolean;
  isNoInternet: boolean;
  isLoading: boolean;
  progressPercent: number;
  error: any;
}

function reducer<RESPONSE, PAYLOAD, PAGINATION = IRequestPagination>(
  state: IReducerState<RESPONSE, PAYLOAD, PAGINATION & IRequestPagination>,
  action: Partial<IReducerState<RESPONSE, PAYLOAD, PAGINATION & IRequestPagination>>
) {
  state = {
    ...state,
    ...action,
  };
  return state;
}

/**
 * @noted <Response Type, Request Type | Payload Type, Filter Pagination Optional>
 */
export default function useRequest<R, P, PG = IRequestPagination>({
  ...props
}: IUseRequestProps): IRequestResponse<R, P, PG> {
  const controllerRef = useRef<AbortController | null>(null);
  const [state, dispatch] = useReducer(reducer<R, P, PG & IRequestPagination>, {
    code: 0,
    data: null as any,
    dataPersist: [] as any,
    message: '',
    meta: {} as IRequestReturnMeta,
    pagination: {} as IRequestPagination,
    payload: {} as IUseRequestPayload<P, PG & IRequestPagination>,
    status: StateStatus.initial,
    isFail: false,
    isLoading: false,
    isNoInternet: false,
    isSuccess: false,
    progressPercent: 0,
    error: null,
  });

  function cancel() {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }

  async function request(v?: IUseRequestPayload<P, PG>): Promise<R> {
    const controller = new AbortController();
    controllerRef.current = controller;

    dispatch({
      status: StateStatus.loading,
    });
    if (!state.payload || !Object.keys(state.payload).length)
      dispatch({
        payload: v! as any,
      });
    try {
      const res = await axiosInstance({
        method: props.method,
        url: getFullUrl(props.url, v?.query || {}),
        params: v?.params,
        data: v?.data,
        headers: v?.headers,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent?.total! || 0);
            dispatch({
              progressPercent: percent,
            });
          }
        },
        signal: controller.signal,
      });

      const isSuccess = +res.data.statusCode < 300;
      dispatch({
        // dataPersist: Array.isArray(res.data.data) ? [...state.dataPersist as any, ...res.data.data ] as any : undefined,
        data: res.data.data,
        message: isSuccess ? res?.data?.message || 'Successfully' : 'Something went wrong',
        status: isSuccess ? StateStatus.success : StateStatus.failure,
        code: res.status,
        meta: {
          current_page: res.data?.current_page,
          allpage: res.data?.all_page,
          total: res.data?.total,
          limit: res.data?.limit,
        },
        pagination: v?.params,
      });
      return res.data;
    } catch (e: any) {
      if (e?.code == 'ERR_NETWORK') {
        dispatch({
          message: 'Please check your internet connection',
          status: StateStatus.noInternet,
        });
      } else if (axios.isCancel(e)) {
        dispatch({
          message: 'Canceled',
          status: StateStatus.canceled,
          data: undefined,
        });
      } else if (e.code == 'ECONNABORTED') {
        dispatch({
          message: 'Request timeout',
          status: StateStatus.failure,
        });
      } else {
        dispatch({
          message:
            typeof e.response?.data?.data == 'string' && e?.response?.data?.data
              ? e.response?.data.data
              : e?.response?.data?.message || 'Something went wrong',
          status: StateStatus.failure,
        });
      }
      dispatch({
        code: e.status,
        meta: undefined,
        error: e?.response?.data,
      });
      throw (
        e?.response?.data ||
        e?.message || {
          message: 'Unknown error',
          status: e?.status || null,
        }
      );
    }
  }

  async function refresh() {
    try {
      return await request({
        data: {
          ...(state.payload?.data as P),
        },
        params: {
          ...(state.payload?.params as IRequestPagination & PG),
          ...state.pagination,
        },
        query: {
          ...state.payload.query,
        },
      });
    } catch (e: any) {
      throw e;
    }
  }

  async function reset() {
    dispatch({
      status: StateStatus.initial,
      data: undefined,
      dataPersist: [] as R,
      message: '',
      code: 0,
      meta: undefined,
      pagination: {
        limit: DEFAULT_LIMIT,
        page: DEFAULT_PAGE,
        ...state.payload.params,
      },
      progressPercent: 0,
      error: null,
    });
  }

  async function clear() {
    dispatch({
      status: StateStatus.initial,
      data: undefined,
      dataPersist: [] as R,
      message: '',
      code: 0,
      meta: undefined,
      pagination: {
        ...state.payload.params,
        limit: 0,
        page: 0,
      },
      progressPercent: 0,
      error: null,
    });
  }

  function onNextPage() {
    if (StateStatus.loading == state.status) return;
    dispatch({
      status: StateStatus.initial,
      pagination: {
        ...state.pagination,
        page: (state.pagination?.page || DEFAULT_PAGE) + 1,
        limit: state.pagination?.limit || DEFAULT_LIMIT,
      },
      error: null,
    });
  }

  function onPrePage() {
    if (StateStatus.loading == state.status) return;
    dispatch({
      status: StateStatus.initial,
      pagination: {
        ...state.pagination,
        page: !state.pagination.page
          ? DEFAULT_PAGE
          : state.pagination.page - 1 < 1
            ? DEFAULT_PAGE
            : state.pagination.page - 1,
        limit: state.pagination?.limit || DEFAULT_LIMIT,
      },
      error: null,
    });
  }

  function changeLimit(l: number = DEFAULT_LIMIT) {
    dispatch({
      status: StateStatus.initial,
      pagination: {
        ...state.pagination,
        limit: l,
      },
      error: null,
    });
  }

  async function onSearch(q: string | undefined, keys: string = 'q', p?: PG & IRequestPagination) {
    try {
      return await request({
        params: {
          ...(state.payload?.params as IRequestPagination & PG),
          [keys]: q,
          ...p,
        },
        query: {
          ...state.payload.query,
        },
      });
    } catch (e: any) {
      throw e;
    }
  }

  function getFilter(): IRequestPagination {
    return {
      limit: DEFAULT_LIMIT,
      page: DEFAULT_PAGE,
      ...state.payload.params,
      ...state.pagination,
    };
  }

  function setPayload(p: IUseRequestPayload<P, PG>) {
    dispatch({
      payload: {
        data: p.data,
        query: p.query,
        params: p.params,
      },
    });
  }

  useEffect(() => {
    if (state.status != StateStatus.success && state.pagination?.page && state.pagination?.limit) {
      request({
        data: state.payload?.data,
        params: {
          ...state.payload?.params,
          ...state.pagination,
        } as IRequestPagination & PG,
        query: state.payload.query,
      }).then();
    }
  }, [state.pagination]);

  useEffect(() => {
    const status = state.status;

    // Loading
    if (status == StateStatus.loading) {
      dispatch({
        isLoading: true,
      });
    } else {
      dispatch({
        isLoading: false,
      });
    }

    // Failure
    if (status == StateStatus.failure) {
      dispatch({
        isFail: true,
      });
    } else {
      dispatch({
        isFail: false,
      });
    }

    // No Internet Connection
    if (status == StateStatus.noInternet) {
      dispatch({
        isNoInternet: true,
      });
    } else {
      dispatch({
        isNoInternet: false,
      });
    }

    // Success
    if (status == StateStatus.success) {
      dispatch({
        isSuccess: true,
      });
    } else {
      dispatch({
        isSuccess: false,
      });
    }
  }, [state.status]);

  return useMemo(
    () => ({
      request,
      reset,
      onNextPage,
      onPrePage,
      changeLimit,
      onSearch,
      refresh,
      state,
      clear,
      getFilter,
      setPayload,
      cancel,
    }),
    [request, reset, onNextPage, onPrePage, changeLimit, onSearch, refresh, state, clear, getFilter, setPayload, cancel]
  );
}
