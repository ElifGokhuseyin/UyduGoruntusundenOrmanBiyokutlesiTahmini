import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'
import { BarChart3, Target } from 'lucide-react'

function MetricsDisplay({ models }) {
  const modelNames = Object.keys(models)
  
  // Prepare bar chart data
  const metricsData = [
    {
      name: 'RMSE',
      ...Object.fromEntries(
        modelNames.map(name => [name, models[name].metrics?.rmse || 0])
      )
    },
    {
      name: 'MAE',
      ...Object.fromEntries(
        modelNames.map(name => [name, models[name].metrics?.mae || 0])
      )
    },
    {
      name: 'Sapma',
      ...Object.fromEntries(
        modelNames.map(name => [Math.abs(models[name].metrics?.bias || 0)])
      )
    }
  ]

  // Prepare radar chart data
  const radarData = modelNames.map(name => {
    const metrics = models[name].metrics || {}
    return {
      model: name,
      'R² (%)': (metrics.r2 || 0) * 100,
      'Pearson (%)': (metrics.pearson_r || 0) * 100,
      'Doğruluk': Math.max(0, 100 - (metrics.rmse || 0) * 2),
      'Hız': name.includes('MobileNet') ? 90 : 60,
    }
  })

  const colors = ['#22c55e', '#16a34a', '#15803d', '#059669']

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-green-200 rounded-lg p-3 shadow-xl">
          <p className="text-gray-800 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="text-gray-800 font-medium">
                {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
        <BarChart3 className="w-6 h-6 text-green-600" />
        <span>Metrik Karşılaştırması</span>
      </h3>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <h4 className="text-gray-800 font-medium mb-4 flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-600" />
            <span>Hata Metrikleri</span>
          </h4>
          <div className="h-64 bg-green-50 rounded-xl p-4 border border-green-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={12} />
                <YAxis stroke="#4b5563" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-gray-700 text-sm">{value}</span>}
                />
                {modelNames.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div>
          <h4 className="text-gray-800 font-medium mb-4">Detaylı Metrikler</h4>
          <div className="bg-green-50 rounded-xl overflow-hidden border border-green-100">
            <table className="w-full">
              <thead>
                <tr className="bg-green-100 border-b border-green-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Metrik</th>
                  {modelNames.map(name => (
                    <th key={name} className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">
                      {name.split('-')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100 bg-white">
                {[
                  { key: 'rmse', label: 'RMSE', format: v => v?.toFixed(4) },
                  { key: 'mae', label: 'MAE', format: v => v?.toFixed(4) },
                  { key: 'bias', label: 'Sapma', format: v => v?.toFixed(4) },
                  { key: 'r2', label: 'R²', format: v => v?.toFixed(4) },
                  { key: 'pearson_r', label: 'Pearson r', format: v => v?.toFixed(4) },
                  { key: 'n_pixels', label: 'Piksel', format: v => v?.toLocaleString() },
                ].map(({ key, label, format }) => (
                  <tr key={key} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{label}</td>
                    {modelNames.map((name, index) => {
                      const value = models[name].metrics?.[key]
                      const isNegative = key === 'bias' && value < 0
                      
                      // Determine best value for highlighting
                      let isBest = false
                      if (key === 'r2' || key === 'pearson_r') {
                        const maxVal = Math.max(...modelNames.map(n => models[n].metrics?.[key] || 0))
                        isBest = value === maxVal
                      } else if (key !== 'n_pixels' && key !== 'bias') {
                        const minVal = Math.min(...modelNames.map(n => models[n].metrics?.[key] || Infinity))
                        isBest = value === minVal
                      }
                      
                      return (
                        <td
                          key={name}
                          className={`px-4 py-3 text-sm ${
                            isBest 
                              ? 'text-green-600 font-semibold' 
                              : isNegative 
                                ? 'text-red-500' 
                                : 'text-gray-700'
                          }`}
                        >
                          {format(value) || '-'}
                          {isBest && <span className="ml-1 text-xs">✓</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-green-100">
        <h4 className="text-gray-800 font-medium mb-4">Performans Özeti</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modelNames.map((name, index) => {
            const metrics = models[name].metrics || {}
            const score = (
              (metrics.r2 || 0) * 50 +
              (1 - Math.min(metrics.rmse || 1, 1)) * 30 +
              (metrics.pearson_r || 0) * 20
            ).toFixed(1)
            
            return (
              <div
                key={name}
                className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
              >
                <div className="text-sm text-gray-600 mb-1">{name}</div>
                <div className="flex items-end space-x-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: colors[index % colors.length] }}
                  >
                    {score}
                  </span>
                  <span className="text-gray-500 text-sm mb-1">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default MetricsDisplay