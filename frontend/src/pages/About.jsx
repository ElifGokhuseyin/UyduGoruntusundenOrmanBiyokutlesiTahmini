import { motion } from 'framer-motion'
import {
  TreePine,
  Satellite,
  Brain,
  Code2,
  Database,
  Globe,
  Github,
  Linkedin,
  Mail,
  BookOpen,
  ExternalLink,
  BarChart3
} from 'lucide-react'

const models = [
  {
    name: 'MobileNetV3-Large',
    description: 'Mobil ve uç cihaz dağıtımı için optimize edilmiş, verimli performans sunan hafif mimari.',
    specs: [
      { label: 'Omurga', value: 'mobilenetv3_large_100' },
      { label: 'Parametre', value: '~5.4M' },
      { label: 'Hız', value: 'Hızlı' },
      { label: 'Doğruluk', value: 'İyi' }
    ],
    metrics: {
      rmse: 16.38,
      mae: 9.63,
      r2: 0.77,
      pearson: 0.90
    },
    color: 'from-green-500 to-emerald-600'
  },
  {
    name: 'EfficientNet-B5',
    description: 'Optimal kaynak kullanımıyla en yüksek doğruluğa ulaşan bileşik ölçekleme mimarisi.',
    specs: [
      { label: 'Omurga', value: 'tf_efficientnet_b5' },
      { label: 'Parametre', value: '~30M' },
      { label: 'Hız', value: 'Orta' },
      { label: 'Doğruluk', value: 'Mükemmel' }
    ],
    metrics: {
      rmse: 15.74,
      mae: 9.09,
      r2: 0.80,
      pearson: 0.90
    },
    color: 'from-emerald-500 to-teal-600'
  }
]

const methodology = [
  {
    icon: Satellite,
    title: 'Uydu Verisi Toplama',
    
  },
  {
    icon: Database,
    title: 'Veri Ön İşleme',
    
  },
  {
    icon: Brain,
    title: 'Derin Öğrenme Çıkarımı',
    
  },
  {
    icon: Globe,
    title: 'Biyokütle Haritalama',
    
  }
]

const techStack = [
  { name: 'PyTorch', description: 'Derin öğrenme çerçevesi' },
  { name: 'FastAPI', description: 'Backend API' },
  { name: 'React', description: 'Frontend çerçevesi' },
  { name: 'TailwindCSS', description: 'Stil kütüphanesi' },
  { name: 'timm', description: 'Model omurgaları' },
  { name: 'smp', description: 'Segmentasyon modelleri' }
]

function About() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Dokümantasyon</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            <span className="gradient-text">Biyokütle Tahmini</span> Hakkında
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Son teknoloji derin öğrenme mimarileri kullanarak çok zamanlı uydu görüntülerinden 
            yerüstü orman biyokütlesini tahmin eden gelişmiş bir sistem.
          </p>
        </motion.div>

        {/* Model Cards */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center"
          >
            Derin Öğrenme Modelleri
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {models.map((model, index) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-green-200 shadow-sm card-hover"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${model.color} mb-4`}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{model.name}</h3>
                <p className="text-gray-600 mb-6">{model.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {model.specs.map(spec => (
                    <div key={spec.label} className="p-3 rounded-xl bg-green-50 border border-green-100">
                      <div className="text-xs text-gray-600 uppercase mb-1">{spec.label}</div>
                      <div className="text-gray-800 font-medium">{spec.value}</div>
                    </div>
                  ))}
                </div>

                {/* Performance Metrics */}
                <div className="pt-6 border-t border-green-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h4 className="text-gray-800 font-semibold">Performans Metrikleri</h4>
                    <span className="text-xs text-gray-500">(100 çip üzerinden)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
                      <div className="text-xs text-green-700 uppercase mb-1">RMSE</div>
                      <div className="text-lg font-bold text-green-600">{model.metrics.rmse}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-xs text-emerald-700 uppercase mb-1">MAE</div>
                      <div className="text-lg font-bold text-emerald-600">{model.metrics.mae}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-center">
                      <div className="text-xs text-teal-700 uppercase mb-1">R²</div>
                      <div className="text-lg font-bold text-teal-600">{model.metrics.r2}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
                      <div className="text-xs text-green-700 uppercase mb-1">Pearson</div>
                      <div className="text-lg font-bold text-green-600">{model.metrics.pearson}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center"
          >
            Metodoloji
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodology.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="mb-4 mt-2">
                  <step.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technical Details */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200"
          >
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <Code2 className="w-6 h-6 text-green-600" />
                  <span>Teknik Özellikler</span>
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white border border-green-100">
                    <h4 className="text-gray-800 font-medium mb-2">Giriş Verisi</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>• Sentinel-1: 4 kanal (VV, VH, VV/VH oranı, zamansal istatistikler)</li>
                      <li>• Sentinel-2: 11 kanal (multispektral bantlar)</li>
                      <li>• Zamansal kapsam: 12 ay</li>
                      <li>• Uzamsal çözünürlük: Çip başına 256×256 piksel</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-green-100">
                    <h4 className="text-gray-800 font-medium mb-2">Model Mimarisi</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>• Temel: Özel kodlayıcılı UNet</li>
                      <li>• Zamansal birleştirme: Dikkat havuzlama</li>
                      <li>• Kod çözücü: Çok ölçekli özellik füzyonu</li>
                      <li>• Çıktı: Tek kanallı regresyon haritası</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Değerlendirme Metrikleri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-green-100 text-center">
                    <div className="text-3xl font-bold gradient-text mb-1">RMSE</div>
                    <div className="text-gray-600 text-sm">Kök Ortalama Kare Hatası</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-green-100 text-center">
                    <div className="text-3xl font-bold gradient-text mb-1">MAE</div>
                    <div className="text-gray-600 text-sm">Ortalama Mutlak Hata</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-green-100 text-center">
                    <div className="text-3xl font-bold gradient-text mb-1">R²</div>
                    <div className="text-gray-600 text-sm">Belirleme Katsayısı</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-green-100 text-center">
                    <div className="text-3xl font-bold gradient-text mb-1">ρ</div>
                    <div className="text-gray-600 text-sm">Pearson Korelasyonu</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-gray-800 font-medium mb-3">Teknoloji Yığını</h4>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map(tech => (
                      <div
                        key={tech.name}
                        className="px-3 py-2 rounded-lg bg-white border border-green-200"
                      >
                        <div className="text-gray-800 text-sm font-medium">{tech.name}</div>
                        <div className="text-gray-500 text-xs">{tech.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Data Sources */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center"
          >
            Veri Kaynakları
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <Satellite className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Sentinel-1</h3>
                  <p className="text-gray-600 text-sm">Sentetik Açıklıklı Radar (SAR)</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Her hava koşulunda, gece-gündüz görüntüleme yeteneği sağlayan C-band SAR verisi. 
                Geri saçılım ölçümleriyle orman yapısını yakalar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-white border border-green-200 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Sentinel-2</h3>
                  <p className="text-gray-600 text-sm">Multispektral Görüntüleme</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                13 spektral banda sahip yüksek çözünürlüklü multispektral görüntüleme. 
                Bitki örtüsü indekslerini ve örtü özelliklerini yakalar.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center pt-12 border-t border-green-100"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
            <TreePine className="w-6 h-6 text-green-500" />
            <span className="text-lg font-medium">Biyokütle Tahmini</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Orman koruma ve karbon izleme uygulamaları için geliştirilmiştir
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a href="https://github.com/ElifGokhuseyin" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-green-50 text-gray-600 hover:text-green-700 hover:bg-green-100 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/elif-g-196b87375/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-green-50 text-gray-600 hover:text-green-700 hover:bg-green-100 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="mailto:elifgokh@gmail.com" className="p-2 rounded-lg bg-green-50 text-gray-600 hover:text-green-700 hover:bg-green-100 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default About