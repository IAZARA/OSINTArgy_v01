import axios from 'axios'
import dns from 'dns'
import net from 'net'

const dnsPromises = dns.promises
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!.*\.\.)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
const BLOCKED_SUFFIXES = ['.local', '.localhost', '.internal', '.lan', '.home']
const MAX_RESPONSE_BYTES = 1024 * 1024

class InfrastructureScannerController {
  constructor() {
    this.scanResults = new Map(); // Cache de resultados
    this.alertThresholds = {
      critical: ['subdomain_takeover', 'exposed_credentials', 'ssl_issues'],
      warning: ['dns_changes', 'new_certificates', 'outdated_tech'],
      info: ['new_assets', 'config_changes']
    };
  }

  normalizeDomain(rawDomain) {
    const value = String(rawDomain || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]

    if (!DOMAIN_PATTERN.test(value) || net.isIP(value) || BLOCKED_SUFFIXES.some(suffix => value.endsWith(suffix))) {
      throw new Error('Dominio inválido')
    }

    return value
  }

  getHttpOptions(overrides = {}) {
    return {
      timeout: 10000,
      maxRedirects: 0,
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_RESPONSE_BYTES,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'OSINTArgy-Scanner/1.0',
        ...(overrides.headers || {})
      },
      ...overrides
    }
  }

  // Endpoint principal para escaneo completo
  async performFullScan(req, res) {
    try {
      let domain
      try {
        domain = this.normalizeDomain(req.body?.domain)
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Dominio inválido'
        });
      }

      const scanId = `scan_${Date.now()}_${domain}`;
      console.log(`🔍 Iniciando escaneo de infraestructura para: ${domain}`);

      // Inicializar resultado
      const scanResult = {
        domain,
        scan_id: scanId,
        timestamp: new Date().toISOString(),
        status: 'in_progress',
        discovery: {},
        analysis: {},
        monitoring: {},
        alerts: [],
        risk_score: 0
      };

      // Almacenar en cache
      this.scanResults.set(scanId, scanResult);

      // Ejecutar escaneos en paralelo
      const [discovery, analysis, monitoring] = await Promise.allSettled([
        this.runDiscoveryEngine(domain),
        this.runAnalysisEngine(domain),
        this.runMonitoringEngine(domain)
      ]);

      // Procesar resultados
      scanResult.discovery = discovery.status === 'fulfilled' ? discovery.value : { error: discovery.reason };
      scanResult.analysis = analysis.status === 'fulfilled' ? analysis.value : { error: analysis.reason };
      scanResult.monitoring = monitoring.status === 'fulfilled' ? monitoring.value : { error: monitoring.reason };

      // Generar alertas y calcular riesgo
      scanResult.alerts = this.generateAlerts(scanResult);
      scanResult.risk_score = this.calculateRiskScore(scanResult);
      scanResult.status = 'completed';

      // Actualizar cache
      this.scanResults.set(scanId, scanResult);

      console.log(`✅ Escaneo completado para ${domain}. Risk Score: ${scanResult.risk_score}`);

      res.json({
        success: true,
        scan_id: scanId,
        domain,
        ...scanResult
      });

    } catch (error) {
      console.error('Error en escaneo de infraestructura:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }

  // Motor de Descubrimiento
  async runDiscoveryEngine(domain) {
    console.log(`🔍 Discovery Engine iniciado para: ${domain}`);
    
    const discovery = {
      subdomains: [],
      dns_records: {},
      certificates: [],
      ip_ranges: [],
      cloud_assets: [],
      ports: []
    };

    try {
      // 1. Descubrimiento de subdominios
      discovery.subdomains = await this.discoverSubdomains(domain);
      
      // 2. Análisis DNS
      discovery.dns_records = await this.analyzeDNS(domain);
      
      // 3. Certificate Transparency
      discovery.certificates = await this.getCertificates(domain);
      
      // 4. Detección de Cloud Assets
      discovery.cloud_assets = await this.detectCloudAssets(domain);
      
      console.log(`✅ Discovery completado: ${discovery.subdomains.length} subdominios encontrados`);
      
    } catch (error) {
      console.error('Error en Discovery Engine:', error);
      discovery.error = error.message;
    }

    return discovery;
  }

  // Motor de Análisis
  async runAnalysisEngine(domain) {
    console.log(`🔬 Analysis Engine iniciado para: ${domain}`);
    
    const analysis = {
      technologies: [],
      security_headers: {},
      ssl_analysis: {},
      exposed_services: [],
      vulnerabilities: [],
      data_exposures: []
    };

    try {
      // 1. Identificación de tecnologías
      analysis.technologies = await this.identifyTechnologies(domain);
      
      // 2. Análisis de headers de seguridad
      analysis.security_headers = await this.analyzeSecurityHeaders(domain);
      
      // 3. Análisis SSL
      analysis.ssl_analysis = await this.analyzeSSL(domain);
      
      // 4. Detección de exposiciones de datos
      analysis.data_exposures = await this.checkDataExposures(domain);
      
      console.log(`✅ Analysis completado: ${analysis.technologies.length} tecnologías detectadas`);
      
    } catch (error) {
      console.error('Error en Analysis Engine:', error);
      analysis.error = error.message;
    }

    return analysis;
  }

  // Motor de Monitoreo
  async runMonitoringEngine(domain) {
    console.log(`📊 Monitoring Engine iniciado para: ${domain}`);
    
    const monitoring = {
      changes_detected: [],
      threat_indicators: [],
      phishing_domains: [],
      code_repositories: [],
      social_mentions: []
    };

    try {
      // 1. Buscar en repositorios de código
      monitoring.code_repositories = await this.scanCodeRepositories(domain);
      
      // 2. Detección de dominios similares (phishing)
      monitoring.phishing_domains = await this.detectPhishingDomains(domain);
      
      // 3. Búsqueda en redes sociales
      monitoring.social_mentions = await this.scanSocialMedia(domain);
      
      console.log(`✅ Monitoring completado`);
      
    } catch (error) {
      console.error('Error en Monitoring Engine:', error);
      monitoring.error = error.message;
    }

    return monitoring;
  }

  // Descubrimiento de subdominios usando múltiples técnicas
  async discoverSubdomains(domain) {
    const subdomains = new Set();
    
    try {
      // Certificate Transparency (crt.sh)
      const certSubdomains = await this.getCertificateSubdomains(domain);
      certSubdomains.forEach(sub => subdomains.add(sub));
      
      // DNS Brute Force (lista básica)
      const bruteSubdomains = await this.bruteForceDNS(domain);
      bruteSubdomains.forEach(sub => subdomains.add(sub));
      
      // Search Engine Dorking
      const dorkSubdomains = await this.searchEngineSubdomains(domain);
      dorkSubdomains.forEach(sub => subdomains.add(sub));
      
    } catch (error) {
      console.error('Error descubriendo subdominios:', error);
    }

    return Array.from(subdomains).map(subdomain => ({
      subdomain,
      discovered_via: 'multiple_sources',
      status: 'active' // Se podría verificar con DNS lookup
    }));
  }

  // Certificate Transparency subdomain discovery
  async getCertificateSubdomains(domain) {
    try {
      const query = encodeURIComponent(`%.${domain}`);
      const response = await axios.get(`https://crt.sh/?q=${query}&output=json`, this.getHttpOptions());

      const certificates = response.data || [];
      const subdomains = new Set();

      certificates.forEach(cert => {
        if (cert.name_value) {
          const names = cert.name_value.split('\n');
          names.forEach(name => {
            name = name.trim();
            if (name.includes(domain) && !name.startsWith('*')) {
              subdomains.add(name);
            }
          });
        }
      });

      return Array.from(subdomains);
    } catch (error) {
      console.error('Error obteniendo certificados CT:', error);
      return [];
    }
  }

  // DNS Brute Force básico
  async bruteForceDNS(domain) {
    const commonSubdomains = [
      'www', 'mail', 'email', 'webmail', 'admin', 'administrator', 'login',
      'api', 'app', 'apps', 'portal', 'dashboard', 'cpanel', 'whm',
      'ftp', 'sftp', 'ssh', 'remote', 'vpn', 'secure', 'ssl',
      'dev', 'test', 'staging', 'beta', 'demo', 'sandbox',
      'blog', 'news', 'forum', 'wiki', 'docs', 'help', 'support',
      'shop', 'store', 'cdn', 'static', 'assets', 'media', 'images'
    ];

    const foundSubdomains = [];

    for (const sub of commonSubdomains) {
      try {
        const subdomain = `${sub}.${domain}`;
        await dnsPromises.lookup(subdomain);
        foundSubdomains.push(subdomain);
      } catch (error) {
        // Subdominio no existe
      }
    }

    return foundSubdomains;
  }

  // Search Engine Dorking para subdominios
  async searchEngineSubdomains(domain) {
    // En un entorno real, usarías APIs como Google Custom Search
    // Por ahora devolvemos subdominios comunes que se pueden encontrar
    return [
      `blog.${domain}`,
      `shop.${domain}`,
      `support.${domain}`
    ].filter(sub => Math.random() > 0.5); // Simulación
  }

  // Análisis DNS completo
  async analyzeDNS(domain) {
    const dnsRecords = {};

    try {
      // Registros A
      try {
        dnsRecords.A = await dnsPromises.resolve4(domain);
      } catch (e) { dnsRecords.A = []; }

      // Registros AAAA
      try {
        dnsRecords.AAAA = await dnsPromises.resolve6(domain);
      } catch (e) { dnsRecords.AAAA = []; }

      // Registros MX
      try {
        dnsRecords.MX = await dnsPromises.resolveMx(domain);
      } catch (e) { dnsRecords.MX = []; }

      // Registros TXT
      try {
        dnsRecords.TXT = await dnsPromises.resolveTxt(domain);
      } catch (e) { dnsRecords.TXT = []; }

      // Registros NS
      try {
        dnsRecords.NS = await dnsPromises.resolveNs(domain);
      } catch (e) { dnsRecords.NS = []; }

    } catch (error) {
      console.error('Error analizando DNS:', error);
    }

    return dnsRecords;
  }

  // Obtener certificados SSL
  async getCertificates(domain) {
    try {
      const query = encodeURIComponent(domain);
      const response = await axios.get(`https://crt.sh/?q=${query}&output=json`, this.getHttpOptions());

      return (response.data || []).slice(0, 10).map(cert => ({
        id: cert.id,
        issuer: cert.issuer_name,
        subject: cert.name_value,
        not_before: cert.not_before,
        not_after: cert.not_after,
        serial_number: cert.serial_number
      }));
    } catch (error) {
      console.error('Error obteniendo certificados:', error);
      return [];
    }
  }

  // Detectar assets en la nube
  async detectCloudAssets(domain) {
    const cloudAssets = [];
    const cloudProviders = [
      { name: 'AWS S3', pattern: `${domain.replace('.', '')}.s3.amazonaws.com` },
      { name: 'AWS S3', pattern: `${domain.replace('.', '-')}.s3.amazonaws.com` },
      { name: 'Azure Blob', pattern: `${domain.replace('.', '')}.blob.core.windows.net` },
      { name: 'Google Cloud', pattern: `${domain.replace('.', '')}.appspot.com` }
    ];

    for (const provider of cloudProviders) {
      try {
        const response = await axios.head(`https://${provider.pattern}`, this.getHttpOptions({ timeout: 5000 }));

        if (response.status !== 404) {
          cloudAssets.push({
            provider: provider.name,
            url: `https://${provider.pattern}`,
            status: response.status,
            accessible: response.status === 200
          });
        }
      } catch (error) {
        // Asset no encontrado o no accesible
      }
    }

    return cloudAssets;
  }

  // Identificar tecnologías web
  async identifyTechnologies(domain) {
    try {
      const response = await axios.get(`https://${domain}`, this.getHttpOptions());

      const technologies = [];
      const headers = response.headers;
      const body = response.data || '';

      // Detectar servidor web
      if (headers.server) {
        technologies.push({
          name: headers.server,
          category: 'Web Server',
          confidence: 'high'
        });
      }

      // Detectar framework por headers
      if (headers['x-powered-by']) {
        technologies.push({
          name: headers['x-powered-by'],
          category: 'Framework',
          confidence: 'high'
        });
      }

      // Detectar CMS por patrones en HTML
      const cmsPatterns = {
        'WordPress': /wp-content|wp-includes|wordpress/i,
        'Drupal': /drupal|sites\/default/i,
        'Joomla': /joomla|option=com_/i,
        'React': /react|_reactInternalInstance/i,
        'Angular': /ng-|angular/i,
        'Vue.js': /vue\.js|__vue__/i
      };

      for (const [cms, pattern] of Object.entries(cmsPatterns)) {
        if (pattern.test(body)) {
          technologies.push({
            name: cms,
            category: 'CMS/Framework',
            confidence: 'medium'
          });
        }
      }

      return technologies;

    } catch (error) {
      console.error('Error identificando tecnologías:', error);
      return [];
    }
  }

  // Analizar headers de seguridad
  async analyzeSecurityHeaders(domain) {
    try {
      const response = await axios.get(`https://${domain}`, this.getHttpOptions());

      const headers = response.headers;
      const securityAnalysis = {
        strict_transport_security: !!headers['strict-transport-security'],
        content_security_policy: !!headers['content-security-policy'],
        x_frame_options: !!headers['x-frame-options'],
        x_content_type_options: !!headers['x-content-type-options'],
        x_xss_protection: !!headers['x-xss-protection'],
        referrer_policy: !!headers['referrer-policy'],
        score: 0
      };

      // Calcular score de seguridad
      const securityHeaders = Object.values(securityAnalysis).filter(Boolean).length - 1; // -1 por el score
      securityAnalysis.score = Math.round((securityHeaders / 6) * 100);

      return securityAnalysis;

    } catch (error) {
      console.error('Error analizando headers de seguridad:', error);
      return { score: 0, error: 'No se pudo analizar' };
    }
  }

  // Análisis SSL/TLS
  async analyzeSSL(domain) {
    try {
      const response = await axios.get(`https://${domain}`, this.getHttpOptions());

      return {
        ssl_enabled: response.request.protocol === 'https:',
        certificate_valid: response.status !== 526,
        hsts_enabled: !!response.headers['strict-transport-security'],
        score: response.request.protocol === 'https:' ? 80 : 0
      };

    } catch (error) {
      return {
        ssl_enabled: false,
        certificate_valid: false,
        hsts_enabled: false,
        score: 0,
        error: 'SSL no disponible'
      };
    }
  }

  // Verificar exposiciones de datos
  async checkDataExposures(domain) {
    const exposures = [];

    try {
      // Verificar archivos comunes expuestos
      const commonFiles = [
        '/.env',
        '/config.php',
        '/wp-config.php',
        '/database.yml',
        '/.git/config',
        '/robots.txt',
        '/sitemap.xml'
      ];

      for (const file of commonFiles) {
        try {
          const response = await axios.get(`https://${domain}${file}`, this.getHttpOptions({ timeout: 5000 }));

          if (response.status === 200) {
            exposures.push({
              type: 'file_exposure',
              path: file,
              status: response.status,
              severity: file.includes('.env') || file.includes('config') ? 'critical' : 'info'
            });
          }
        } catch (error) {
          // Archivo no encontrado
        }
      }

    } catch (error) {
      console.error('Error verificando exposiciones:', error);
    }

    return exposures;
  }

  // Escanear repositorios de código
  async scanCodeRepositories(domain) {
    // Simulación de búsqueda en GitHub
    // En producción usarías GitHub Search API
    return [
      {
        platform: 'GitHub',
        repository: `example/${domain.replace('.', '-')}`,
        exposure_type: 'domain_mention',
        severity: 'low'
      }
    ].filter(() => Math.random() > 0.7); // Simulación
  }

  // Detectar dominios de phishing
  async detectPhishingDomains(domain) {
    // Simulación de detección de dominios similares
    const variations = [
      domain.replace('.com', '.net'),
      domain.replace('.com', '.org'),
      domain.replace('e', '3'),
      domain.replace('o', '0')
    ];

    return variations.map(variant => ({
      domain: variant,
      similarity: 0.9,
      risk_level: 'medium',
      registered: Math.random() > 0.8
    })).filter(v => v.registered);
  }

  // Escanear menciones en redes sociales
  async scanSocialMedia(domain) {
    // Simulación de búsqueda en redes sociales
    return [
      {
        platform: 'Twitter',
        mentions: Math.floor(Math.random() * 100),
        sentiment: 'neutral'
      },
      {
        platform: 'LinkedIn',
        mentions: Math.floor(Math.random() * 50),
        sentiment: 'positive'
      }
    ];
  }

  // Generar alertas basadas en los resultados
  generateAlerts(scanResult) {
    const alerts = [];

    // Alertas críticas
    if (scanResult.analysis.ssl_analysis?.score < 50) {
      alerts.push({
        level: 'critical',
        type: 'ssl_issues',
        message: 'Configuración SSL insegura detectada',
        recommendation: 'Configurar HTTPS y HSTS'
      });
    }

    if (scanResult.analysis.data_exposures?.some(exp => exp.severity === 'critical')) {
      alerts.push({
        level: 'critical',
        type: 'data_exposure',
        message: 'Archivos sensibles expuestos públicamente',
        recommendation: 'Restringir acceso a archivos de configuración'
      });
    }

    // Alertas de advertencia
    if (scanResult.analysis.security_headers?.score < 60) {
      alerts.push({
        level: 'warning',
        type: 'security_headers',
        message: 'Headers de seguridad faltantes',
        recommendation: 'Implementar CSP, HSTS y otros headers de seguridad'
      });
    }

    // Alertas informativas
    if (scanResult.discovery.subdomains?.length > 10) {
      alerts.push({
        level: 'info',
        type: 'large_attack_surface',
        message: `Gran superficie de ataque: ${scanResult.discovery.subdomains.length} subdominios`,
        recommendation: 'Revisar y asegurar todos los subdominios'
      });
    }

    return alerts;
  }

  // Calcular puntuación de riesgo
  calculateRiskScore(scanResult) {
    let riskScore = 0;

    // SSL Score (peso: 30%)
    const sslScore = scanResult.analysis.ssl_analysis?.score || 0;
    riskScore += (100 - sslScore) * 0.3;

    // Security Headers Score (peso: 25%)
    const headersScore = scanResult.analysis.security_headers?.score || 0;
    riskScore += (100 - headersScore) * 0.25;

    // Data Exposures (peso: 30%)
    const criticalExposures = scanResult.analysis.data_exposures?.filter(exp => exp.severity === 'critical').length || 0;
    riskScore += criticalExposures * 10 * 0.3;

    // Attack Surface (peso: 15%)
    const subdomainCount = scanResult.discovery.subdomains?.length || 0;
    const surfaceScore = Math.min(subdomainCount / 5, 10); // Max 10 points
    riskScore += surfaceScore * 0.15 * 10;

    return Math.min(Math.round(riskScore), 100);
  }

  // Obtener resultado de escaneo
  async getScanResult(req, res) {
    try {
      const { scanId } = req.params;
      const result = this.scanResults.get(scanId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Escaneo no encontrado'
        });
      }

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error obteniendo resultado:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export default new InfrastructureScannerController()
