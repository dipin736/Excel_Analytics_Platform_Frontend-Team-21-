import React from 'react';
import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useKeyboardShortcuts = ({
  onSave,
  onDownload,
  onClose,
  onUndo,
  onRedo,
  onToggleDarkMode,
  onRefresh,
  onNewChart,
  onSearch,
  enabled = true
}) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

    // Ctrl/Cmd + S: Save
    if ((ctrlKey || metaKey) && key === 's') {
      event.preventDefault();
      if (onSave) {
        onSave();
        toast.info('💾 Save triggered (Ctrl+S)', { autoClose: 1500 });
      }
    }

    // Ctrl/Cmd + D: Download
    if ((ctrlKey || metaKey) && key === 'd') {
      event.preventDefault();
      if (onDownload) {
        onDownload();
        toast.info('📥 Download triggered (Ctrl+D)', { autoClose: 1500 });
      }
    }

    // Escape: Close modal/dialog
    if (key === 'Escape') {
      if (onClose) {
        onClose();
      }
    }

    // Ctrl/Cmd + Z: Undo
    if ((ctrlKey || metaKey) && key === 'z' && !shiftKey) {
      event.preventDefault();
      if (onUndo) {
        onUndo();
        toast.info('↶ Undo triggered (Ctrl+Z)', { autoClose: 1500 });
      }
    }

    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
    if ((ctrlKey || metaKey) && ((key === 'z' && shiftKey) || key === 'y')) {
      event.preventDefault();
      if (onRedo) {
        onRedo();
        toast.info('↷ Redo triggered (Ctrl+Shift+Z)', { autoClose: 1500 });
      }
    }

    // Ctrl/Cmd + K: Toggle dark mode
    if ((ctrlKey || metaKey) && key === 'k') {
      event.preventDefault();
      if (onToggleDarkMode) {
        onToggleDarkMode();
        toast.info('🌙 Dark mode toggled (Ctrl+K)', { autoClose: 1500 });
      }
    }

    // F5 or Ctrl/Cmd + R: Refresh
    if (key === 'F5' || ((ctrlKey || metaKey) && key === 'r')) {
      event.preventDefault();
      if (onRefresh) {
        onRefresh();
        toast.info('🔄 Refresh triggered (F5)', { autoClose: 1500 });
      }
    }

    // Ctrl/Cmd + N: New chart
    if ((ctrlKey || metaKey) && key === 'n') {
      event.preventDefault();
      if (onNewChart) {
        onNewChart();
        toast.info('📊 New chart triggered (Ctrl+N)', { autoClose: 1500 });
      }
    }

    // Ctrl/Cmd + F: Search
    if ((ctrlKey || metaKey) && key === 'f') {
      event.preventDefault();
      if (onSearch) {
        onSearch();
        toast.info('🔍 Search triggered (Ctrl+F)', { autoClose: 1500 });
      }
    }

    // Alt + 1-9: Quick navigation
    if (altKey && key >= '1' && key <= '9') {
      event.preventDefault();
      const tabIndex = parseInt(key) - 1;
      toast.info(`📋 Navigate to tab ${key} (Alt+${key})`, { autoClose: 1500 });
      // You can implement tab navigation here
    }

  }, [enabled, onSave, onDownload, onClose, onUndo, onRedo, onToggleDarkMode, onRefresh, onNewChart, onSearch]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  // Return a function to show available shortcuts
  const showShortcuts = useCallback(() => {
    const shortcuts = [
      { key: 'Ctrl+S', action: 'Save chart/dashboard' },
      { key: 'Ctrl+D', action: 'Download chart' },
      { key: 'Esc', action: 'Close modal/dialog' },
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Shift+Z', action: 'Redo' },
      { key: 'Ctrl+K', action: 'Toggle dark mode' },
      { key: 'F5', action: 'Refresh data' },
      { key: 'Ctrl+N', action: 'New chart' },
      { key: 'Ctrl+F', action: 'Search' },
      { key: 'Alt+1-9', action: 'Quick navigation' }
    ];

    toast.info(
      <div>
        <h4 className="font-semibold mb-2">⌨️ Keyboard Shortcuts</h4>
        <div className="text-sm space-y-1">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                {key}
              </kbd>
              <span className="ml-2">{action}</span>
            </div>
          ))}
        </div>
      </div>,
      { 
        autoClose: 8000,
        closeButton: true,
        position: 'top-right'
      }
    );
  }, []);

  return { showShortcuts };
};

// Hook for specific chart shortcuts
export const useChartShortcuts = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onRotate,
  onToggleLegend,
  enabled = true
}) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, ctrlKey, shiftKey } = event;

    // + or =: Zoom in
    if (key === '+' || key === '=') {
      event.preventDefault();
      if (onZoomIn) onZoomIn();
    }

    // -: Zoom out
    if (key === '-') {
      event.preventDefault();
      if (onZoomOut) onZoomOut();
    }

    // 0: Reset zoom
    if (key === '0') {
      event.preventDefault();
      if (onReset) onReset();
    }

    // Arrow keys: Rotate (with Ctrl)
    if (ctrlKey) {
      switch (key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (onRotate) onRotate('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (onRotate) onRotate('right');
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (onRotate) onRotate('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (onRotate) onRotate('down');
          break;
      }
    }

    // L: Toggle legend
    if (key === 'l' || key === 'L') {
      event.preventDefault();
      if (onToggleLegend) onToggleLegend();
    }

  }, [enabled, onZoomIn, onZoomOut, onReset, onRotate, onToggleLegend]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
}; 