import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import WorkspaceHeader from './WorkspaceHeader.svelte';
import { setActiveTab, setConnectionState, setProtocolVersion, setLayerCount, setDeviceName, markSaved } from '../../store/app.svelte';

describe('WorkspaceHeader', () => {
  beforeEach(() => {
    setActiveTab('keymap');
    setConnectionState('disconnected');
    setProtocolVersion(1);
    setLayerCount(3);
    setDeviceName('');
    markSaved();
  });

  it('renders page heading from destination metadata', () => {
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('Keymap Editor');
  });

  it('shows connection state card with Disconnected', () => {
    setConnectionState('disconnected');
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('Disconnected');
  });

  it('shows connected state when connected', () => {
    setConnectionState('connected');
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('Connected');
  });

  it('shows protocol version card', () => {
    setProtocolVersion(3);
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('Protocol');
    expect(document.body.textContent).toContain('v3');
  });

  it('shows layer count card', () => {
    setLayerCount(5);
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('5 Layers');
  });

  it('shows pending changes count', () => {
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('0 Changes');
  });

  it('manual omits protocol and layer cards', () => {
    setActiveTab('manual');
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('Manual Pengguna');
    expect(document.body.textContent).not.toContain('Protocol');
    expect(document.body.textContent).not.toContain('Layer');
    expect(document.body.textContent).not.toContain('Changes');
  });

  it('shows layer selector for keymap tab', () => {
    setLayerCount(3);
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('L0');
    expect(document.body.textContent).toContain('L1');
    expect(document.body.textContent).toContain('L2');
  });

  it('shows layer selector for encoder tab', () => {
    setActiveTab('encoder');
    setLayerCount(2);
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('L0');
    expect(document.body.textContent).toContain('L1');
  });

  it('hides layer selector for non-keymap/encoder', () => {
    setActiveTab('lighting');
    setLayerCount(3);
    render(WorkspaceHeader);
    expect(document.body.textContent).not.toContain('L0');
  });

  it('shows device name context when available', () => {
    setDeviceName('My Keyboard');
    setConnectionState('connected');
    render(WorkspaceHeader);
    expect(document.body.textContent).toContain('My Keyboard');
  });

  it('does not duplicate ready label', () => {
    setConnectionState('connected');
    render(WorkspaceHeader);
    expect(document.body.textContent).not.toContain('Ready');
  });
});
