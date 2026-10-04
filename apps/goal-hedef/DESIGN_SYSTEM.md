# 🎨 NEO-BRUTALIST DESIGN SYSTEM & FRONTEND SPECIFICATION
> **Felsefe:** BOLD. LOUD. SYSTEMATIC. PLAYFUL. UNAPOLOGETIC.  
> Bu doküman, projedeki tüm UI/UX ve Frontend geliştirmeleri için mutlak kaynak standarttır.

---

## 1. Temel Görsel Kurallar (Foundations)

### 1.1. Renk Paleti (Color Tokens)
| Token Adı | HEX Kodu | Tailwind Sınıfı | Kullanım Alanı |
|---|---|---|---|
| **Paper Beige** | `#F5F0E6` | `bg-[#F5F0E6]` | Genel sayfa ve tuval ana zemin rengi |
| **Pure Black** | `#000000` | `border-black text-black bg-black` | Tüm kenarlıklar (3px/4px), ana metinler ve sert gölgeler |
| **Pure White** | `#FFFFFF` | `bg-white` | Kart iç zeminleri, zengin metin kutuları |
| **Accent Yellow** | `#FFE600` | `bg-[#FFE600]` | Birincil aksiyonlar, önemli uyarılar, Sticky Notlar |
| **Accent Teal / Cyan** | `#00C2CB` | `bg-[#00C2CB]` | Kariyer hedefleri, birincil butonlar, aktif sekmeler |
| **Accent Magenta / Pink** | `#FF3399` | `bg-[#FF3399]` | Yaratıcı hedefler, sticker rozetler, vurgulamalar |
| **Accent Orange** | `#FF6B35` | `bg-[#FF6B35]` | Devam eden işler, metrik kutuları, dikkat çekici alanlar |
| **Accent Lime / Green** | `#22C55E` | `bg-[#22C55E]` | Tamamlanan hedefler (%100), başarı rozetleri |
| **Accent Purple** | `#A855F7` | `bg-[#A855F7]` | Kilometre taşları ve alt hedefler |

---

## 2. Tipografi ve Metin Hiyerarşisi (Typography)

- **Font Ailesi:** `Space Grotesk` / `Plus Jakarta Sans` (Heavy/Black ağırlıklar) + El yazısı/Retro vurgular için `Caveat` & `Syne`.
- **H1 (Giant Heading):** `font-black tracking-tight text-black uppercase`
- **H2 & H3:** `font-extrabold uppercase tracking-wide`
- **Etiketler & Rozetler:** `font-black text-xs uppercase tracking-wider`
- **Yazım Kuralı:** Başlıklar, buton metinleri ve durum etiketleri her zaman **BÜYÜK HARF (UPPERCASE)** veya belirgin kalınlıkta olmalıdır.

---

## 3. Gölge & Kenarlık Kuralları (Strokes & Hard Elevation)

> ⚠️ **YUMUŞAK BLUR GÖLGELER VE GLASSMORPHISM YASAKTIR.**  
> Neo-Brutalism'de bulanık gölge (blur-md, blur-xl) yerine **sıfır bulanıklıklı sert açılı siyah gölgeler** kullanılır.

### 3.1. Kenarlıklar (Borders)
- Tüm bileşenler `border-2 border-black`, `border-3 border-black` veya `border-4 border-black` ile çevrelenir.
- Köşeler genellikle `rounded-none`, `rounded-md` ya da en fazla `rounded-xl` (sert geometrik kavis) olmalıdır.

### 3.2. Sert Gölgeler (Hard Offset Shadows)
- **Shadow-0:** `shadow-none`
- **Shadow-1 (Standart Kartlar):** `shadow-[4px_4px_0px_0px_#000000]`
- **Shadow-2 (Öne Çıkan / Floating):** `shadow-[6px_6px_0px_0px_#000000]`
- **Shadow-3 (Dev Kart / Modal):** `shadow-[8px_8px_0px_0px_#000000]`

### 3.3. Mikro-Etkileşimler (Buton Basılma Fiziği)
Bir Neo-Brutalist butona tıklandığında fiziksel olarak içeri basılmalıdır:
```css
/* Tailwind Örneği */
className="border-3 border-black bg-[#FFE600] font-black uppercase px-4 py-2 
           shadow-[4px_4px_0px_0px_#000] 
           hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] 
           active:translate-x-[4px] active:translate-y-[4px] active:shadow-none 
           transition-all duration-100"
```

---

## 4. Bileşen Standartları (Component Specs)

### 4.1. Hedef Kartları (Goal Cards)
- Zemin: `bg-white` veya hafif bej
- Kenarlık: `border-3 border-black`
- Gölge: `shadow-[6px_6px_0px_0px_#000]`
- Başlık Şeridi: Canlı renkli blok (`bg-[#00C2CB]`, `bg-[#FF6B35]` vb.) üzerinde siyah kalın yazı ve ikon
- İlerleme Çubuğu: `border-2 border-black bg-white h-4 p-0.5` içine dolan canlı yeşil/sarı blok
- Rozetler: `border-2 border-black px-2 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]`

### 4.2. Sticky Notlar & Retro Çıkartmalar (Stickers)
- Renkli zemin (`bg-[#FFE600]`, `bg-[#FF3399]` vb.)
- Yıldız/Çiçek/Retro etiketler: `"LET'S GO! ⚡"`, `"STAY POSITIVE 🌸"`, `"OMG! ⭐"`
- Hafif açısal döndürme (`rotate-1`, `-rotate-2`) ile serbest el hissi.

### 4.3. Zengin Not Defteri (Evernote Drawer)
- Zemin: `bg-[#F5F0E6]` (Paper Beige)
- Sol kenarlık: `border-l-4 border-black`
- Editör kutuları: `border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]`
- Checkbox'lar: Kalın siyah kare `border-2 border-black checked:bg-black`

---

## 5. UI/UX & Frontend Uzmanı Taahhüdü

Bu projede kullanıcı tarafından istenen her yeni özellik, kart, tuval aracı, modal ve bileşen **istisnasız bu Neo-Brutalist kurallara göre** geliştirilecektir.
