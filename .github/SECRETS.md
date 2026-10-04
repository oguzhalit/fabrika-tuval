# GitHub Secrets Configuration

Bu dosya fabrika-tuval projesinde kullanılan GitHub secrets'ları tanımlar.

## 📋 Tanımlı Secrets

### Goal-Hedef App Secrets

#### `GOAL_HEDEF_API_KEY` (Optional)
- **Açıklama**: Goal-Hedef uygulamasının API key'i
- **Gerekli**: Hayır (şimdilik)
- **Tip**: String
- **Kullanım**: `env.GOAL_HEDEF_API_KEY` (GitHub Actions workflow'larında)

#### `GOAL_HEDEF_DATABASE_URL` (Optional)
- **Açıklama**: Goal-Hedef'in veritabanı bağlantı URL'i
- **Gerekli**: Hayır (şimdilik)
- **Tip**: String (masked)
- **Kullanım**: `env.GOAL_HEDEF_DATABASE_URL`

## 🔧 Secrets Tanımlama (GitHub Web UI)

1. Repository'ye git: https://github.com/oguzhalit/fabrika-tuval
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** tıkla
4. Secret'ı aşağıdaki bilgilerle doldur:
   - **Name**: `GOAL_HEDEF_API_KEY` (örneğin)
   - **Secret**: Gizli değeri yapıştır
5. **Add secret** tıkla

## 🔐 Secrets Kullanımı (Workflow'larda)

```yaml
- name: Use secret
  env:
    API_KEY: ${{ secrets.GOAL_HEDEF_API_KEY }}
  run: |
    echo "API Key configured"
    # Secrets çıktıda gösterilmez
```

## ⚠️ Güvenlik Notları

- Secrets hiçbir zaman repository'ye commit edilmemeli
- `.env` dosyaları `.gitignore`'a dahildir
- Workflow logs'unda secrets otomatik olarak maskelenir
- Secrets rotasyonu periyodik olarak yapılmalı
- Yalnızca gerekli workflows'lar secrets'a erişebilmeli

## 🔄 Local Development

Local'de development yaparken `.env.local` dosyası kullanın:

```bash
# apps/goal-hedef/.env.local (gitignore'da var)
VITE_API_KEY=your-local-key
VITE_DATABASE_URL=local-db-url
```

Vite, `VITE_` prefix'li env variables'ları client-side'da kullanabilir.

## 📝 Bilgilendirme

Yeni secret eklendiğinde bu dosyayı güncelleyin, ama secret'ın kendisini değil!
