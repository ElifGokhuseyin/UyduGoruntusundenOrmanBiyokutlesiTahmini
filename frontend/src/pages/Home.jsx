import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  TreePine, 
  Satellite, 
  Brain, 
  BarChart3, 
  ArrowRight,
  Layers
} from 'lucide-react'

const features = [
  {
    icon: Satellite,
    title: 'Uydu Görüntüleri',
    description: 'Kapsamlı analiz için 12 aylık Sentinel-1 ve Sentinel-2 uydu verilerini işleyin.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Brain,
    title: 'Derin Öğrenme Modelleri',
    description: 'MobileNetV3-Large ve EfficientNet-B5 mimarilerinden tahminleri karşılaştırın.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: BarChart3,
    title: 'Detaylı Metrikler',
    description: 'RMSE, MAE, R² ve diğer metrikleri interaktif görselleştirmelerle inceleyin.',
    color: 'from-teal-500 to-green-600'
  },
  {
    icon: Layers,
    title: 'Çok Zamanlı Analiz',
    description: 'Mevsimsel değişimleri yakalamak için zamansal dikkat mekanizmalarını kullanın.',
    color: 'from-green-600 to-emerald-500'
  }
]

function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
                <TreePine className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Orman Karbon Haritalama</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-800 mb-6"
            >
              <span className="text-gray-700">Uydu Görüntülerinden</span>
              <br />
              <span className="gradient-text">Biyokütle Tahmini</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-10"
            >
              Son teknoloji derin öğrenme modelleri kullanarak yerüstü biyokütleyi tahmin edin. 
              MobileNetV3-Large ve EfficientNet-B5 tahminlerini yan yana karşılaştırın.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/predict')}
                className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
              >
                <span>Tahmine Başla</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/about')}
                className="flex items-center space-x-2 px-8 py-4 bg-white rounded-xl text-green-700 font-semibold border border-green-200 hover:bg-green-50 transition-all"
              >
                <span>Daha Fazla Bilgi</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Derin öğrenme ve uydu görüntüleri kullanarak son teknoloji biyokütle tahmini
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-6 rounded-2xl bg-white border border-green-100 hover:border-green-200 transition-all card-hover"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Comparison Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative p-8 rounded-3xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Model Tahminlerini Karşılaştır
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Farklı derin öğrenme mimarilerinden gelen tahminleri yan yana görüntüleyin.
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-6 max-w-lg">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center p-4">
                  <span className="text-green-800 font-semibold text-center">MobileNetV3-Large</span>
                </div>
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-green-200 flex items-center justify-center p-4">
                  <span className="text-green-800 font-semibold text-center">EfficientNet-B5</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
              Biyokütle Tahmini Yapmaya Hazır mısınız?
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600 mb-8">
              Uydu görüntüsü yükleyin veya test verilerinden seçim yapın.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/predict')}
              className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              <span>Şimdi Başla</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <TreePine className="w-5 h-5 text-green-500" />
              <span>Biyokütle Tahmini 2025</span>
            </div>
            <div className="text-gray-500 text-sm">
              Elif Gökhüseyin
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home