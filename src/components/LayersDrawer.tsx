import React, { useState } from 'react';
import { LifeLayer } from '../types';
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Trophy,
  Flag,
  Calendar,
  Sparkles,
  DollarSign,
  Palette,
} from 'lucide-react';

interface LayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LifeLayer[];
  onToggleLayer: (id: string) => void;
  onAddLayer: (layer: LifeLayer) => void;
  onDeleteLayer: (id: string) => void;
  onUpdateLayerColor: (id: string, color: string) => void;
  onShowAllLayers: () => void;
  onHideAllLayers: () => void;
}

const COLOR_PRESETS = [
  '#22c55e', // Green (Football)
  '#a855f7', // Purple (Color Guard)
  '#38bdf8', // Sky Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#e11d48', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const LayersDrawer: React.FC<LayersDrawerProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayerColor,
  onShowAllLayers,
  onHideAllLayers,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState(COLOR_PRESETS[0]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;

    const newLayer: LifeLayer = {
      id: `layer-${Date.now()}`,
      name: newLayerName.trim(),
      color: newLayerColor,
      isVisible: true,
    };

    onAddLayer(newLayer);
    setNewLayerName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Calendar Life Layers</h3>
              <p className="text-xs text-slate-400">Toggle schedules & color coding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-200 leading-relaxed">
              <strong className="text-purple-300">Clean Separation:</strong> Life layers (like football or color guard) are visual overlays only. Toggling them on or off will <em>never</em> alter your bank balances or budget math!
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onHideAllLayers}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Money Only (Hide All)</span>
            </button>
            <button
              onClick={onShowAllLayers}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Show All Life Layers</span>
            </button>
          </div>

          {/* Layers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Family & Life Schedules</span>
              <span>{layers.length} Active</span>
            </div>

            <div className="space-y-2">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    layer.isVisible
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle visibility checkbox */}
                    <button
                      onClick={() => onToggleLayer(layer.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        layer.isVisible
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-800 border border-slate-700 text-transparent'
                      }`}
                      title={layer.isVisible ? 'Hide layer' : 'Show layer'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Color Dot & Name */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {layer.name}
                      </span>
                    </div>
                  </div>

                  {/* Color Swatch Picker / Delete */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => onUpdateLayerColor(layer.id, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      title="Change layer color"
                    />
                    <button
                      onClick={() => {
                        if (confirm(`Delete the "${layer.name}" layer?`)) {
                          onDeleteLayer(layer.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                      title="Delete layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Layer Form */}
          {showAddForm ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-800/90 border border-purple-500/40 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Create New Schedule Layer</span>
              </h4>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Layer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Band Practice, Swimming, Work Trips"
                  value={newLayerName}
                  onChange={(e) => setNewLayerName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pick Color</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLayerColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newLayerColor === color ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newLayerColor}
                    onChange={(e) => setNewLayerColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white font-bold"
                >
                  Add Layer
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add Custom Life Schedule Layer</span>
            </button>
          )}

          {/* Financial Item Badges Reference */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Financial Legend & Badges
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Paydays / Incomes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Fixed Bills (Rent)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Fluctuating (Electric)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>Debt Payoff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
