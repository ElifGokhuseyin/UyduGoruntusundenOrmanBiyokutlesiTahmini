import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import {
  Upload,
  Folder,
  FileText,
  X,
  Loader2,
  Play,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Cpu,
  Clock,
  BarChart3,
  Info
} from 'lucide-react'
import ComparisonCard from '../components/ComparisonCard'
import MetricsDisplay from '../components/MetricsDisplay'

const API_BASE = '/api'

function Predict() {
  const [chips, setChips] = useState([])
  const [selectedChip, setSelectedChip] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [models, setModels] = useState([])
  const [selectedModels, setSelectedModels] = useState([])
  const [inputMode, setInputMode] = useState('chip') // 'chip' or 'upload'
  const [groundTruth, setGroundTruth] = useState(null)

  // Fetch available chips and models on mount
  useEffect(() => {
    fetchChips()
    fetchModels()
  }, [])

  const fetchChips = async () => {
    try {
      const response = await axios.get(`${API_BASE}/chips`)
      setChips(response.data.chips || [])
      if (response.data.chips?.length > 0) {
        setSelectedChip(response.data.chips[0])
      }
    } catch (err) {
      console.error('Çipler alınamadı:', err)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/models`)
      setModels(response.data.models || [])
      setSelectedModels(response.data.models?.map(m => m.name) || [])
    } catch (err) {
      console.error('Modeller alınamadı:', err)
    }
  }

  const onDrop = useCallback((acceptedFiles) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/tiff': ['.tif', '.tiff']
    }
  })

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handlePredict = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)
    setGroundTruth(null)

    try {
      let response

      if (inputMode === 'chip' && selectedChip) {
        response = await axios.post(`${API_BASE}/predict`, {
          chip_id: selectedChip,
          model_names: selectedModels.length > 0 ? selectedModels : null,
          ntta: 1,
          include_ground_truth: true
        })
      } else if (inputMode === 'upload' && uploadedFiles.length > 0) {
        const formData = new FormData()
        uploadedFiles.forEach(file => {
          formData.append('files', file)
        })
        
        response = await axios.post(
          `${API_BASE}/predict/upload?ntta=1${selectedModels.length > 0 ? `&model_names=${selectedModels.join(',')}` : ''}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        )
      } else {
        throw new Error('Lütfen bir çip seçin veya dosya yükleyin')
      }

      setResults(response.data)
      
      // Fetch ground truth if available (for both chip and upload modes)
      if (response.data.ground_truth_available && response.data.chip_id) {
        try {
          const gtResponse = await axios.get(`${API_BASE}/ground-truth/${response.data.chip_id}`)
          setGroundTruth(gtResponse.data)
        } catch {
          console.log('Referans verisi mevcut değil')
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Tahmin başarısız oldu')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleModel = (modelName) => {
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
  }

  const handleDownload = async (modelName) => {
    if (!results) return
    
    try {
      const response = await axios.get(
        `${API_BASE}/results/${results.id}/download/${modelName}`,
        { responseType: 'blob' }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${results.chip_id}_${modelName.replace(' ', '_')}_tahmin.tif`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('İndirme başarısız:', err)
    }
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
            Biyokütle Tahmini
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Yerüstü biyokütleyi tahmin etmek için bir test çipi seçin veya kendi uydu görüntülerinizi yükleyin
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Input Mode Toggle */}
            <div className="p-1 bg-green-50 rounded-xl border border-green-200">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setInputMode('chip')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    inputMode === 'chip'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'text-gray-600 hover:text-green-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span>Test Çipleri</span>
                  </div>
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    inputMode === 'upload'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'text-gray-600 hover:text-green-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Yükle</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Chip Selection */}
            <AnimatePresence mode="wait">
              {inputMode === 'chip' ? (
                <motion.div
                  key="chip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                    <Folder className="w-5 h-5 text-green-600" />
                    <span>Test Çipi Seç</span>
                  </h3>
                  <div className="relative">
                    <select
                      value={selectedChip}
                      onChange={(e) => setSelectedChip(e.target.value)}
                      className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {chips.map(chip => (
                        <option key={chip} value={chip}>{chip}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {chips.length} çip mevcut
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                      isDragActive
                        ? 'border-green-500 bg-green-100'
                        : 'border-green-300 bg-green-50/50 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center">
                      <Upload className={`w-12 h-12 mx-auto mb-4 ${
                        isDragActive ? 'text-green-600' : 'text-green-500'
                      }`} />
                      <p className="text-gray-800 font-medium mb-1">
                        {isDragActive ? 'Dosyaları buraya bırakın' : 'TIFF dosyalarını sürükle & bırak'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        veya göz atmak için tıklayın
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        Test veri setindeki dosyalar otomatik tanınır
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="p-4 rounded-xl bg-white border border-green-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Yüklenen Dosyalar ({uploadedFiles.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-green-50"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model Selection */}
            <div className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-green-600" />
                <span>Modeller</span>
              </h3>
              <div className="space-y-3">
                {models.map(model => (
                  <label
                    key={model.name}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.name)}
                      onChange={() => toggleModel(model.name)}
                      className="w-5 h-5 rounded bg-white border-green-300 text-green-500 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">{model.name}</div>
                      <div className="text-sm text-gray-600">{model.backbone}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${model.loaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </label>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePredict}
              disabled={isLoading || selectedModels.length === 0}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                isLoading || selectedModels.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>İşleniyor...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Tahmini Çalıştır</span>
                </>
              )}
            </motion.button>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">Hata</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl bg-white border border-green-200 shadow-sm"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-green-200 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-6 text-gray-800 font-medium">Tahmin yapılıyor...</p>
                  <p className="text-gray-600 text-sm">Bu birkaç saniye sürebilir</p>
                </motion.div>
              ) : results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Success Banner */}
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-green-700 font-medium">Tahmin Tamamlandı</p>
                      <p className="text-green-600 text-sm">
                        Çip: {results.chip_id} | ID: {results.id}
                      </p>
                    </div>
                  </div>

                  {/* Ground Truth (if available) - Sadece görüntü */}
                  {groundTruth && (
                    <div className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                        <Info className="w-5 h-5 text-green-600" />
                        <span>Referans Verisi (Ground Truth)</span>
                      </h3>
                      <div className="max-w-md mx-auto">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={`data:image/png;base64,${groundTruth.heatmap}`}
                            alt="Referans Verisi"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Model Comparison Cards */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(results.models).map(([modelName, data]) => (
                      <ComparisonCard
                        key={modelName}
                        modelName={modelName}
                        data={data}
                        onDownload={() => handleDownload(modelName)}
                        hasGroundTruth={results.ground_truth_available}
                      />
                    ))}
                  </div>

                  {/* Detailed Metrics Comparison */}
                  {results.ground_truth_available && (
                    <MetricsDisplay models={results.models} />
                  )}
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
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-800 font-medium">Henüz tahmin yok</p>
                  <p className="text-gray-600 text-sm max-w-xs text-center mt-2">
                    Sonuçları görmek için bir çip seçin veya dosya yükleyin ve "Tahmini Çalıştır"a tıklayın
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

export default Predict