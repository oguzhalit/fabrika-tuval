# 🏗️ Homelab Preview Deployment Setup

Bu guide, GitHub PR açıldığında otomatik olarak homelab'da Docker container deploy eden ve Cloudflare DNS record oluşturan workflow'u setup etmek için yazılmıştır.

## 📋 Ön Gereksinimler

- ✅ Proxmox sunucusu (homelab'da)
- ✅ Cloudflare hesabı
- ✅ Docker (homelab'da kurulu)
- ✅ GitHub repository admin access

---

## 🔐 GitHub Secrets Setup

### 1. Proxmox Credentials

**Repository Settings → Secrets and variables → Actions**'ta şunları ekleyin:

#### `PROXMOX_HOST`
```
https://proxmox.homelab.local:8006
```
(Proxmox API endpoint URL'i)

#### `PROXMOX_USER`
```
root@pam
```
(veya sizin Proxmox kullanıcınız)

#### `PROXMOX_API_TOKEN`
```
pveum user token add root@pam workflows
```
Proxmox UI'da:
1. Datacenter → Permissions → API Tokens
2. "Add" butonuna tıkla
3. User: `root@pam`
4. Token ID: `workflows`
5. Privilege Separation: ✅ 
6. Token value'yu kopyala ve secret'a ekle

#### `PROXMOX_NODE`
```
proxmox-node-1
```
(Proxmox node adı - `pvesh get /nodes` ile bulabilirsiniz)

---

### 2. Cloudflare Credentials

#### `CLOUDFLARE_API_TOKEN`
1. Cloudflare hesabında login
2. Profile → API Tokens
3. "Create Token" → Template "Edit zone DNS"
4. Zone: `oguzsak.com`
5. Token'ı kopyala

#### `CLOUDFLARE_ZONE_ID`
```
Cloudflare Dashboard → Domain → Right sidebar
```
Zone ID'yi kopyala

#### `CLOUDFLARE_DOMAIN`
```
oguzsak.com
```

---

### 3. Homelab Setup

#### `HOMELAB_INTERNAL_IP`
```
192.168.1.100
```
(Proxmox/Docker host'un internal IP'si)

---

## 🧪 Test Etme

### 1. Manual Test
```bash
# Proxmox API test
curl -X GET \
  -H "Authorization: PVEAPIToken=root@pam!workflows=xxx" \
  https://proxmox.homelab.local:8006/api2/json/nodes

# Cloudflare API test
curl -X GET \
  -H "Authorization: Bearer xxx" \
  https://api.cloudflare.com/client/v4/zones/ZONE_ID
```

### 2. PR Üzerinden Test
1. Feature branch oluştur
2. Küçük bir değişiklik yap
3. PR aç
4. GitHub Actions'u izle
5. Preview URL'i test et

---

## 🔄 Workflow Akışı

### PR Açıldığında:
```
1. Code checkout
   ↓
2. Docker image build
   ↓
3. Proxmox'a deploy (LXC/Container)
   ↓
4. Cloudflare DNS record oluştur
   ↓
5. PR'a comment yaz (preview URL)
   ↓
6. Live preview ready!
```

### PR Kapatıldığında:
```
1. Proxmox container remove
   ↓
2. Cloudflare DNS record remove
   ↓
3. PR'a cleanup comment yaz
   ↓
4. Preview silinmiş!
```

---

## 🚀 Preview URL Format

```
https://pr-{NUMBER}-draw.oguzsak.com
```

Örneğin PR #3 için:
```
https://pr-3-draw.oguzsak.com
```

---

## 🐛 Troubleshooting

### "Proxmox API error"
- API token'ını kontrol et
- PROXMOX_HOST URL'inin doğru olduğunu kontrol et
- Firewall kurallarını kontrol et

### "Cloudflare DNS creation failed"
- API token permissions'ı kontrol et
- Zone ID'nin doğru olduğunu kontrol et
- Rate limiting check et

### "Docker build fails"
- `Dockerfile`'ın bulunduğunu kontrol et
- Build context'i kontrol et (`.github/workflows/pr-preview-deploy.yml`'da `context: ./apps/goal-hedef`)

---

## 📚 İlgili Dosyalar

- `.github/workflows/pr-preview-deploy.yml` - Main workflow
- `Dockerfile` - Docker image definition
- `.github/SETUP-HOMELAB.md` - Bu dosya

---

## 🎯 Sonraki Adımlar

1. ✅ Secrets ekle (yukarıda)
2. ✅ Proxmox ve Cloudflare test et
3. ✅ Feature branch oluştur
4. ✅ PR aç ve test et
5. ✅ Workflow'u monitor et

---

**Questions?** Check Fabrika documentation or GitHub Actions docs.

Happy previewing! 🎉
