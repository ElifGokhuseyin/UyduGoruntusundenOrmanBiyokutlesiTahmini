import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  History,
  Trash2,
  Eye,
  Download,
  Clock,
  Cpu,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'

const API_BASE = '/api'

function Results() {
  const [results, setResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/results`)
      setResults(response.data.results || [])
    } catch (err) {
      setError('Sonuçlar alınamadı')
    } finally {
      setIsLoading(false)
    }
  }

  const viewResult = async (resultId) => {
    try {
      const response = await axios.get(`${API_BASE}/results/${resultId}`)
      setSelectedResult(response.data)
    } catch (err) {
      console.error('Sonuç alınamadı:', err)
    }
  }

  const deleteResult = async (resultId) => {
    try {
      await axios.delete(`${API_BASE}/results/${resultId}`)
      setResults(prev => prev.filter(r => r.id !== resultId))
      if (selectedResult?.id === resultId) {
        setSelectedResult(null)
      }
    } catch (err) {
      console.error('Sonuç silinemedi:', err)
    }
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('tr-TR')
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Tahmin Geçmişi
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Önceki biyokütle tahminlerinizi görüntüleyin ve yönetin
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Results List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                  <History className="w-5 h-5 text-green-600" />
                  <span>Son Sonuçlar</span>
                </h3>
                <button
                  onClick={fetchResults}
                  className="p-2 rounded-lg bg-green-50 text-gray-600 hover:text-green-700 hover:bg-green-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-700">Henüz tahmin yok</p>
                  <p className="text-gray-500 text-sm">Sonuçları görmek için bir tahmin çalıştırın</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {results.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedResult?.id === result.id
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-green-50 hover:bg-green-100 border border-transparent'
                      }`}
                      onClick={() => viewResult(result.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-gray-800 font-medium">{result.chip_id}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(result.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {result.ground_truth_available ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.models.map(model => (
                          <span
                            key={model}
                            className="px-2 py-1 text-xs rounded-md bg-white text-gray-700 border border-green-200"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            viewResult(result.id)
                          }}
                          className="p-1.5 rounded-lg bg-green-200 text-green-700 hover:bg-green-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteResult(result.id)
                          }}
                          className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Result Detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              {selectedResult ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedResult.chip_id}</h2>
                        <p className="text-gray-600">ID: {selectedResult.id}</p>
                      </div>
                      <button
                        onClick={() => setSelectedResult(null)}
                        className="p-2 rounded-lg bg-green-50 text-gray-600 hover:text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(selectedResult.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Cpu className="w-4 h-4" />
                        <span>{Object.keys(selectedResult.models).length} model</span>
                      </div>
                      {selectedResult.ground_truth_available && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Referans verisi</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Results */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(selectedResult.models).map(([modelName, data]) => (
                      <div
                        key={modelName}
                        className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{modelName}</h3>
                            <p className="text-sm text-gray-600">{data.backbone}</p>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{data.processing_time?.toFixed(2)}s</span>
                          </div>
                        </div>

                        {/* Heatmap */}
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                          <img
                            src={`data:image/png;base64,${data.heatmap}`}
                            alt={`${modelName} tahmini`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {data.stats && Object.entries(data.stats).map(([key, value]) => (
                            <div key={key} className="p-2 rounded-lg bg-green-50 border border-green-100">
                              <div className="text-xs text-gray-600 uppercase">{key}</div>
                              <div className="text-sm font-medium text-gray-800">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Metrics (if available) */}
                        {data.metrics && (
                          <div className="pt-4 border-t border-green-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Metrikler</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                                <div className="text-xs text-green-700">RMSE</div>
                                <div className="text-sm font-medium text-green-600">
                                  {data.metrics.rmse?.toFixed(3)}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                                <div className="text-xs text-emerald-700">MAE</div>
                                <div className="text-sm font-medium text-emerald-600">
                                  {data.metrics.mae?.toFixed(3)}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-center">
                                <div className="text-xs text-teal-700">R²</div>
                                <div className="text-sm font-medium text-teal-600">
                                  {data.metrics.r2?.toFixed(3)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl bg-white border border-green-200 border-dashed"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-800 font-medium">Görüntülemek için bir sonuç seçin</p>
                  <p className="text-gray-600 text-sm max-w-xs text-center mt-2">
                    Detaylı tahminleri görmek için listeden herhangi bir sonuca tıklayın
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Results