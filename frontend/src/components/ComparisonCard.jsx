import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Clock,
  Maximize2,
  X
} from 'lucide-react'

function ComparisonCard({ modelName, data, onDownload, hasGroundTruth }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoverValue, setHoverValue] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 256)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 256)
    setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    
    const estimatedValue = (data.stats.min + data.stats.max) / 2
    setHoverValue({ x, y, value: estimatedValue.toFixed(2) })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-white border border-green-200 shadow-lg card-hover"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-green-800">{modelName}</h3>
            <p className="text-sm text-gray-600">{data.backbone}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-green-50 border border-green-100 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{data.processing_time?.toFixed(2)}s</span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div 
          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4 cursor-crosshair group"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverValue(null)}
        >
          <img
            src={`data:image/png;base64,${data.heatmap}`}
            alt={`${modelName} tahmini`}
            className="w-full h-full object-cover"
          />
          
          {/* Hover tooltip */}
          {hoverValue && (
            <div
              className="absolute z-10 px-2 py-1 text-xs bg-gray-800 text-white rounded pointer-events-none"
              style={{
                left: hoverPosition.x + 10,
                top: hoverPosition.y - 30,
              }}
            >
              ({hoverValue.x}, {hoverValue.y})
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Colorbar */}
          <div className="absolute bottom-2 left-2 right-2 h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-600 via-emerald-400 to-yellow-400 opacity-80">
            <div className="absolute inset-0 flex justify-between items-center px-2 text-[8px] text-white font-medium">
              <span>0</span>
              <span>200</span>
              <span>400 Mg/ha</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {hasGroundTruth && data.metrics && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                <div className="text-xs text-green-700 uppercase mb-1">RMSE</div>
                <div className="text-xl font-bold text-green-600">
                  {data.metrics.rmse?.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs text-emerald-700 uppercase mb-1">MAE</div>
                <div className="text-xl font-bold text-emerald-600">
                  {data.metrics.mae?.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center">
                <div className="text-xs text-teal-700 uppercase mb-1">R²</div>
                <div className="text-xl font-bold text-teal-600">
                  {data.metrics.r2?.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownload}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-500/20"
        >
          <Download className="w-4 h-4" />
          <span>TIFF İndir</span>
        </motion.button>
      </motion.div>

      {/* Expanded Modal */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
          onClick={() => setIsExpanded(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -top-12 right-0 p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={`data:image/png;base64,${data.heatmap}`}
                alt={`${modelName} tahmini büyütülmüş`}
                className="w-full h-auto"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-gray-800 bg-white rounded-xl p-4">
              <span className="text-lg font-semibold">{modelName}</span>
              <span className="text-gray-600">{data.backbone}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

export default ComparisonCard