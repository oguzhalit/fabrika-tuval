# GitHub Secrets Configuration

Bu dosya fabrika-tuval projesinde kullanılan GitHub secrets'ları tanımlar.

## 📋 Şu Anda Kullanılan Secrets

Şu an itibarıyla fabrika-tuval'da secrets gerekli değil.

### Gelecek İçin Hazırlık

Projede yeni features eklendikçe (API integration, auth, vb.) secrets'lar tanımlanacak.

## 🔧 Secrets Tanımlama (GitHub Web UI)

1. Repository'ye git: https://github.com/oguzhalit/fabrika-tuval
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** tıkla
4. Secret'ı aşağıdaki bilgilerle doldur:
   - **Name**: Secret adı (örn: `API_KEY`)
   - **Secret**: Gizli değeri yapıştır
5. **Add secret** tıkla

## 🔐 Secrets Kullanımı (Workflow'larda)

```yaml
- name: Use secret
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: |
    echo "Secret configured"
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
# .env.local (gitignore'da var)
VITE_API_KEY=your-local-key
VITE_DATABASE_URL=local-db-url
```

Vite, `VITE_` prefix'li env variables'ları client-side'da kullanabilir.

## 📝 Bilgilendirme

Yeni secret eklendiğinde bu dosyayı güncelleyin, ama secret'ın kendisini değil!

### Şu Anda Secrets'ı Olmayan Apps

- **Goal-Hedef**: Sadece client-side React/Vite uygulaması, API/DB ihtiyacı yok
- **Fabrika-CLI**: Lokal build araçı, external secrets gerekli değil
- **Fabrika-PI**: Skill/agent bundler, secrets gerekli değil
