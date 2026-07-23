'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  createMobileDevice,
  formatMobileDeviceLastAccess,
  getDefaultMobileAppSidebarItem,
  MOCK_MOBILE_DEVICES,
  MOBILE_APP_SIDEBAR_ITEMS,
  MOBILE_DEVICE_FOLDER_OPTIONS,
  type MobileAppSidebarId,
  type MobileDevice,
} from '@/data/mock-survey-mobile-app';
import { SurveyMobileDeviceDetail } from '@/components/surveys/SurveyMobileDeviceDetail';
import styles from './SurveyMobileAppPanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

const WuMenuSeparatorItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);

const PAGE_SIZE = 100;

const DEFAULT_FORM = {
  deviceName: '',
  username: '',
  folder: 'Main Folder',
};

function DeviceRowActions({
  device,
  onOpen,
  onDeactivate,
  onCopyKey,
}: {
  device: MobileDevice;
  onOpen: (device: MobileDevice) => void;
  onDeactivate: (device: MobileDevice) => void;
  onCopyKey: (device: MobileDevice) => void;
}) {
  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className={styles.rowActionTrigger}
          aria-label={`${device.deviceName} actions`}
        >
          <span className="wm-more-vert" />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => onOpen(device)}>Open settings</WuMenuItem>
      <WuMenuItem onSelect={() => onCopyKey(device)}>Copy device key</WuMenuItem>
      <WuMenuSeparatorItem />
      <WuMenuItem
        onSelect={() => onDeactivate(device)}
        disabled={device.status === 'Inactive'}
      >
        Deactivate
      </WuMenuItem>
    </WuMenu>
  );
}

export function SurveyMobileAppPanel() {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [activeSidebar, setActiveSidebar] = useState<MobileAppSidebarId>(
    getDefaultMobileAppSidebarItem()
  );
  const [devices, setDevices] = useState<MobileDevice[]>(MOCK_MOBILE_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [deactivateTarget, setDeactivateTarget] = useState<MobileDevice | null>(null);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return devices;

    return devices.filter(
      (device) =>
        device.deviceName.toLowerCase().includes(query) ||
        device.username.toLowerCase().includes(query)
    );
  }, [devices, search]);

  const totalCount = filteredDevices.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageStart = totalCount === 0 ? 0 : safePageIndex * PAGE_SIZE + 1;
  const pageEnd = Math.min((safePageIndex + 1) * PAGE_SIZE, totalCount);
  const pageDevices = filteredDevices.slice(
    safePageIndex * PAGE_SIZE,
    (safePageIndex + 1) * PAGE_SIZE
  );

  const allPageSelected =
    pageDevices.length > 0 && pageDevices.every((device) => selectedIds.has(device.id));

  function handleCopyKey(device: MobileDevice): void {
    void navigator.clipboard?.writeText(device.deviceKey);
    showToast({ message: `Device key "${device.deviceKey}" copied`, variant: 'success' });
  }

  function handleSearchChange(value: string): void {
    setSearch(value);
    setPageIndex(0);
    setSelectedIds(new Set());
  }

  function toggleSelectAll(checked: boolean): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageDevices.forEach((device) => next.add(device.id));
      } else {
        pageDevices.forEach((device) => next.delete(device.id));
      }
      return next;
    });
  }

  function toggleSelectOne(deviceId: string, checked: boolean): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(deviceId);
      } else {
        next.delete(deviceId);
      }
      return next;
    });
  }

  function handleAddDevice(): void {
    if (!formData.deviceName.trim()) {
      showToast({ message: 'Enter a device name', variant: 'error' });
      return;
    }
    if (!formData.username.trim()) {
      showToast({ message: 'Enter a username', variant: 'error' });
      return;
    }

    const nextDevice = createMobileDevice(formData);
    setDevices((prev) => [nextDevice, ...prev]);
    setIsAddOpen(false);
    setFormData(DEFAULT_FORM);
    setActiveSidebar('my-devices');
    setPageIndex(0);
    showToast({ message: `"${nextDevice.deviceName}" added`, variant: 'success' });
  }

  function handleSaveDevice(nextDevice: MobileDevice): void {
    setDevices((prev) =>
      prev.map((device) => (device.id === nextDevice.id ? nextDevice : device))
    );
  }

  function handleDeactivate(): void {
    if (!deactivateTarget) return;

    setDevices((prev) =>
      prev.map((device) =>
        device.id === deactivateTarget.id
          ? { ...device, status: 'Inactive', uuid: null, lastAccessAt: null, lastAccessIp: null }
          : device
      )
    );
    showToast({
      message: `"${deactivateTarget.deviceName}" deactivated`,
      variant: 'success',
    });
    setDeactivateTarget(null);
    setSelectedIds(new Set());
  }

  function renderMainContent() {
    if (activeSidebar === 'manual-sync') {
      return (
        <EmptyState
          icon="wm-sync"
          title="Manual Sync"
          description="Push survey packages to selected devices and pull offline responses in a future release."
          action={
            <WuButton
              variant="secondary"
              onClick={() =>
                showToast({ message: 'Manual sync is coming soon', variant: 'info' })
              }
            >
              Start sync
            </WuButton>
          }
        />
      );
    }

    if (activeSidebar === 'ftp-sync') {
      return (
        <EmptyState
          icon="wm-cloud-upload"
          title="FTP Sync"
          description="Configure FTP credentials and schedule offline response uploads in a future release."
          action={
            <WuButton
              variant="secondary"
              onClick={() =>
                showToast({ message: 'FTP sync settings are coming soon', variant: 'info' })
              }
            >
              Configure FTP
            </WuButton>
          }
        />
      );
    }

    return (
      <>
        <div className={styles.toolbar}>
          <WuButton onClick={() => setIsAddOpen(true)} className={styles.addDeviceButton}>
            <span className="wm-add" /> Add Device
          </WuButton>

          <div className={styles.toolbarRight}>
            <label className={styles.searchField}>
              <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search by device name or username"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search by device name or username"
              />
            </label>
            <div className={styles.pagination} aria-label="Device list pagination">
              <span className={styles.paginationLabel}>
                {totalCount === 0 ? '0 - 0 of 0' : `${pageStart} - ${pageEnd} of ${totalCount}`}
              </span>
              <button
                type="button"
                className={styles.paginationButton}
                aria-label="Previous page"
                disabled={safePageIndex <= 0}
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              >
                <span className="wm-chevron-left" />
              </button>
              <button
                type="button"
                className={styles.paginationButton}
                aria-label="Next page"
                disabled={safePageIndex >= pageCount - 1 || totalCount === 0}
                onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
              >
                <span className="wm-chevron-right" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {pageDevices.length === 0 ? (
            <EmptyState
              icon="wm-smartphone"
              title="No devices found"
              description={
                search.trim()
                  ? 'Try a different device name or username'
                  : 'Add a device to start collecting responses offline'
              }
              action={
                !search.trim() ? (
                  <WuButton onClick={() => setIsAddOpen(true)}>
                    <span className="wm-add" /> Add Device
                  </WuButton>
                ) : undefined
              }
            />
          ) : (
            <table className={styles.devicesTable}>
              <colgroup>
                <col className={styles.colCheck} />
                <col className={styles.colName} />
                <col className={styles.colStatus} />
                <col className={styles.colKey} />
                <col className={styles.colPassword} />
                <col className={styles.colFolder} />
                <col className={styles.colUuid} />
                <col className={styles.colLastAccess} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={styles.checkCell}>
                    <WuCheckbox
                      checked={allPageSelected}
                      onChange={(checked) => toggleSelectAll(Boolean(checked))}
                      aria-label="Select all devices on this page"
                    />
                  </th>
                  <th scope="col">Device Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Device Key</th>
                  <th scope="col">Password</th>
                  <th scope="col">Folder</th>
                  <th scope="col">UUID</th>
                  <th scope="col">Last Access</th>
                  <th scope="col" className={styles.actionsHeader}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageDevices.map((device) => {
                  const lastAccess = formatMobileDeviceLastAccess(device);
                  return (
                    <tr key={device.id}>
                      <td className={styles.checkCell}>
                        <WuCheckbox
                          checked={selectedIds.has(device.id)}
                          onChange={(checked) =>
                            toggleSelectOne(device.id, Boolean(checked))
                          }
                          aria-label={`Select ${device.deviceName}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.deviceNameLink}
                          title={device.deviceName}
                          onClick={() => setSelectedDeviceId(device.id)}
                        >
                          {device.deviceName}
                        </button>
                      </td>
                      <td>
                        <span className={styles.cellText}>{device.status}</span>
                      </td>
                      <td>
                        <span className={styles.monoCell}>{device.deviceKey}</span>
                      </td>
                      <td>
                        <span className={styles.monoCell}>{device.password}</span>
                      </td>
                      <td>
                        <span className={styles.cellText} title={device.folder}>
                          {device.folder}
                        </span>
                      </td>
                      <td>
                        <span className={styles.uuidCell} title={device.uuid ?? undefined}>
                          {device.uuid ?? ''}
                        </span>
                      </td>
                      <td>
                        <span className={styles.lastAccessCell} title={lastAccess}>
                          {lastAccess}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <DeviceRowActions
                          device={device}
                          onOpen={(item) => setSelectedDeviceId(item.id)}
                          onCopyKey={handleCopyKey}
                          onDeactivate={setDeactivateTarget}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  if (selectedDevice) {
    return (
      <div className={styles.workspace}>
        <SurveyMobileDeviceDetail
          key={selectedDevice.id}
          device={selectedDevice}
          onBack={() => setSelectedDeviceId(null)}
          onSave={handleSaveDevice}
        />
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <nav className={styles.sidebar} aria-label="Mobile App distribution">
        {MOBILE_APP_SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.sidebarItem} ${
              activeSidebar === item.id ? styles.sidebarItemActive : ''
            }`}
            onClick={() => setActiveSidebar(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.main}>
        <div className={styles.panel}>{renderMainContent()}</div>
      </div>

      {isAddOpen && wick ? (
        <wick.WuModal open onOpenChange={setIsAddOpen} size="md" variant="action">
          <wick.WuModalHeader>Add Device</wick.WuModalHeader>
          <wick.WuModalContent>
            <div className={styles.formFields}>
              <WuInput
                Label="Device Name"
                variant="outlined"
                placeholder="e.g. Field Tablet 08"
                value={formData.deviceName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deviceName: e.target.value }))
                }
              />
              <WuInput
                Label="Username"
                variant="outlined"
                placeholder="e.g. field.tablet.08"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
              <WuSelect
                data={MOBILE_DEVICE_FOLDER_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={
                  MOBILE_DEVICE_FOLDER_OPTIONS.find((o) => o.value === formData.folder) ??
                  null
                }
                onSelect={(v) => {
                  const item = v as { value: string; label: string };
                  setFormData((prev) => ({ ...prev, folder: item.value }));
                }}
                Label="Folder"
                variant="outlined"
              />
            </div>
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <WuButton
              onClick={handleAddDevice}
              disabled={!formData.deviceName.trim() || !formData.username.trim()}
            >
              Add Device
            </WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}

      <ConfirmModal
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Deactivate device?"
        description={`"${deactivateTarget?.deviceName}" will no longer sync survey responses.`}
        confirmLabel="Deactivate"
        variant="critical"
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
