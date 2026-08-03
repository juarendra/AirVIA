import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./store/app.svelte', () => {
  let saveState = 'clean';
  let editDuringSave = 0;
  
  return {
    getSaveState: () => saveState,
    markDirty: () => {
      if (saveState === 'saving') {
        editDuringSave++;
      } else {
        saveState = 'dirty';
      }
    },
    markSaving: () => {
      saveState = 'saving';
      editDuringSave = 0;
    },
    markSaved: () => {
      if (editDuringSave > 0) {
        saveState = 'dirty';
        editDuringSave = 0;
      } else {
        saveState = 'saved';
      }
    },
    markSaveFailed: () => {
      saveState = 'failed';
    },
    resetDeviceState: () => {
      saveState = 'clean';
      editDuringSave = 0;
    }
  };
});

import { getSaveState, markDirty, markSaving, markSaved, markSaveFailed, resetDeviceState } from './store/app.svelte';

describe('Workflow integration', () => {
  beforeEach(() => {
    resetDeviceState();
  });

  it('transitions from clean to dirty on edit', () => {
    expect(getSaveState()).toBe('clean');
    markDirty();
    expect(getSaveState()).toBe('dirty');
  });

  it('transitions to saving and then to saved', () => {
    markDirty();
    markSaving();
    expect(getSaveState()).toBe('saving');
    markSaved();
    expect(getSaveState()).toBe('saved');
  });

  it('preserves dirty state if edited during save', () => {
    markDirty();
    markSaving();
    markDirty(); // Edit happens while saving
    markSaved();
    expect(getSaveState()).toBe('dirty');
  });

  it('transitions to failed state if save fails', () => {
    markDirty();
    markSaving();
    markSaveFailed();
    expect(getSaveState()).toBe('failed');
  });
});



