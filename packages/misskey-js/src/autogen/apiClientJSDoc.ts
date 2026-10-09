import type { SwitchCaseResponseType } from '../api.js';
import type { Endpoints } from '../api.types.js';

declare module '../api.js' {
  export interface APIClient {
    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-user-reports*
     */
    request<E extends 'admin/abuse-user-reports', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'admin/accounts/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:meta*
     */
    request<E extends 'admin/captcha/current', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'admin/captcha/save', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:delete-all-files-of-a-user*
     */
    request<E extends 'admin/delete-all-files-of-a-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:drive*
     */
    request<E extends 'admin/drive/clean-remote-files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:drive*
     */
    request<E extends 'admin/drive/cleanup', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:drive*
     */
    request<E extends 'admin/drive/files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:drive*
     */
    request<E extends 'admin/drive/show-file', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/delete-all-files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/refresh-remote-instance-metadata', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/remove-all-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/update-instance', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/forward-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:index-stats*
     */
    request<E extends 'admin/get-index-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:table-stats*
     */
    request<E extends 'admin/get-table-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:user-ips*
     */
    request<E extends 'admin/get-user-ips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:invite-codes*
     */
    request<E extends 'admin/invite/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:invite-codes*
     */
    request<E extends 'admin/invite/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/clear', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/deliver-delayed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/inbox-delayed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/jobs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/pause', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/promote-jobs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/queue-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/queues', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/remove-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/resume', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/retry-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/show-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/show-job-logs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:relays*
     */
    request<E extends 'admin/relays/add', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:relays*
     */
    request<E extends 'admin/relays/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:relays*
     */
    request<E extends 'admin/relays/remove', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:reset-password*
     */
    request<E extends 'admin/reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/resolve-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/assign', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/unassign', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/update-default-policies', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:send-email*
     */
    request<E extends 'admin/send-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-moderation-log*
     */
    request<E extends 'admin/show-moderation-logs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-user*
     */
    request<E extends 'admin/show-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-user*
     */
    request<E extends 'admin/show-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:suspend-user*
     */
    request<E extends 'admin/suspend-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-mfa*
     */
    request<E extends 'admin/unset-mfa', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-user-avatar*
     */
    request<E extends 'admin/unset-user-avatar', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-user-banner*
     */
    request<E extends 'admin/unset-user-banner', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:unsuspend-user*
     */
    request<E extends 'admin/unsuspend-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/update-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:admin:user-note*
     */
    request<E extends 'admin/update-user-note', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:federation*
     */
    request<E extends 'ap/get', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'ap/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'app/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'app/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'auth/accept', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/generate', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/userkey', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'bubble-game/ranking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'bubble-game/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/favorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'channels/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/follow', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/followed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/mute/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/mute/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/mute/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/my-favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/owned', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'channels/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'channels/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'channels/timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/unfavorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/unfollow', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/history', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/create-to-room', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/create-to-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/react', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/room-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/unreact', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/user-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/read-all', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/invitations/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/invitations/ignore', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/invitations/inbox', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/invitations/outbox', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/join', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/joining', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/leave', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/members', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/mute', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/owned', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/attached-chat-messages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Find the notes to which the given file is attached.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/attached-notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Check if a given file exists.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/check-existence', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Delete an existing drive file.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a drive file by the given parameters.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/find', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a drive file by a hash of the contents.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/find-by-hash', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/move-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the properties of a drive file.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Update the properties of a drive file.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Request the server to download a new drive file from the specified URL.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/upload-from-url', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders/find', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/stream', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'email-address/available', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/followers', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/instances', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/show-instance', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'federation/update-remote-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'federation/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'fetch-external-resources', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'fetch-rss', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'flash/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:flash-likes*
     */
    request<E extends 'flash/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:flash*
     */
    request<E extends 'flash/my', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:flash-likes*
     */
    request<E extends 'flash/my-likes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'flash/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'flash/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:flash-likes*
     */
    request<E extends 'flash/unlike', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/done', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/key-done', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/password-less', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/register-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/remove-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/unregister', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/update-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/authorized-apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/change-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-antennas', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-blocking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-clips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-mute', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-user-lists', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-antennas', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-blocking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-muting', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-user-lists', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:page-likes*
     */
    request<E extends 'i/page-likes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:pages*
     */
    request<E extends 'i/pages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/regenerate-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Revoke an access token of the authenticated user. Requires credential. When called with an access token (third-party app), only the token currently in use can be revoked.
     *
     * **Credential required**: *No*
     */
    request<E extends 'i/revoke-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/signin-history', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/update-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:invite-codes*
     */
    request<E extends 'invite/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:invite-codes*
     */
    request<E extends 'invite/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:invite-codes*
     */
    request<E extends 'invite/limit', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:invite-codes*
     */
    request<E extends 'invite/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'miauth/gen-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'my/apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'page-push', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'pages/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:page-likes*
     */
    request<E extends 'pages/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'pages/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:page-likes*
     */
    request<E extends 'pages/unlike', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Request a users password to be reset.
     *
     * **Credential required**: *No*
     */
    request<E extends 'request-reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.
     *
     * **Credential required**: *No*
     */
    request<E extends 'reset-db', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Complete the password reset that was previously requested.
     *
     * **Credential required**: *No*
     */
    request<E extends 'reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/cancel-match', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'reversi/games', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'reversi/invitations', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/match', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'reversi/show-game', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/surrender', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'reversi/verify', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'roles/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'roles/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'roles/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'roles/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Endpoint for testing input validation.
     *
     * **Credential required**: *No*
     */
    request<E extends 'test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'username/available', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all flashs this user created.
     *
     * **Credential required**: *No*
     */
    request<E extends 'users/flashs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all pages this user created.
     *
     * **Credential required**: *No*
     */
    request<E extends 'users/pages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * File a report.
     *
     * **Credential required**: *Yes* / **Permission**: *write:report-abuse*
     */
    request<E extends 'users/report-abuse', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     *
     * **Credential required**: *No*
     */
    request<E extends 'verify-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Get a list of other users that the specified user frequently replies to.
     */
    request<E extends 'users/get-frequently-replied-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show users that the authenticated user might be interested to follow.
     */
    request<E extends 'users/recommendation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for users.
     */
    request<E extends 'users/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a user by username and/or host.
     */
    request<E extends 'users/search-by-username-and-host', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Register to receive push notifications.
     */
    request<E extends 'sw/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Check push notification registration exists.
     */
    request<E extends 'sw/show-registration', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Unregister from receiving push notifications.
     */
    request<E extends 'sw/unregister', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Update push notification registration.
     */
    request<E extends 'sw/update-registration', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Delete a note. Requires write:notes permission.
     */
    request<E extends 'notes/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the properties of a user.
     */
    request<E extends 'users/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Upload a new drive file. Requires write:drive permission.
     */
    request<E extends 'drive/files/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;
  }
}
