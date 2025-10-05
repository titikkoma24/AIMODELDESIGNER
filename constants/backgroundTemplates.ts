export const shotStyles: string[] = [
  "Medium Shot",
  "Full-Body Shot",
  "Close-up Portrait",
  "Cowboy Shot (Mid-thigh up)",
  "Wide Shot (Shows context)",
  "Extreme Wide Shot",
  "Low-Angle (Looking up)",
  "High-Angle (Looking down)",
  "Dutch Angle (Tilted)",
  "Eye-Level Shot",
  "Profile Shot (Side view)",
  "Over-the-Shoulder Shot",
  "Point-of-View (POV)",
  "Worm's-Eye View (From ground)",
  "Bird's-Eye View (Directly above)",
  "Dramatic Silhouette",
  "Fashion Magazine Cover Style",
  "Candid Street Photography",
  "Cinematic Frame",
  "Glamour Shot",
  "Intimate Handheld Shot",
  "Documentary Style",
  "Noir Film Style",
  "Found Footage Style",
  "Time-lapse Style",
  "Slow Motion Effect",
  "Split Diopter Shot",
  "Vertigo Effect (Dolly Zoom)",
  "Lens Whacking Style",
  "Minimalist Composition"
];

export const lightStyles: { name: string; description: string }[] = [
  { name: "Natural Light", description: "Menggunakan cahaya matahari langsung, baik pagi atau sore. Hasilnya lembut dan alami. Cocok untuk outdoor." },
  { name: "Golden Hour Light", description: "Cahaya saat matahari terbit atau terbenam. Hangat, lembut, dan bikin warna kulit terlihat lebih indah." },
  { name: "Blue Hour Light", description: "Cahaya setelah matahari tenggelam. Tone biru gelap elegan, pas buat cityscape atau mood dramatis." },
  { name: "Rembrandt Lighting", description: "Teknik klasik potret: segitiga kecil cahaya di bawah mata sisi shadow. Memberi kesan dramatis dan berkarakter." },
  { name: "Split Lighting", description: "Cahaya membelah wajah jadi setengah terang, setengah gelap. Kesan misterius, tegas, dan kuat." },
  { name: "Loop Lighting", description: "Sumber cahaya sedikit di samping atas wajah, menghasilkan bayangan kecil di sisi hidung. Kesan natural dan soft." },
  { name: "Butterfly Lighting", description: "Cahaya dari depan atas subjek, menghasilkan bayangan kupu-kupu di bawah hidung. Sering dipakai di beauty shot." },
  { name: "High Key Lighting", description: "Cahaya terang, minim shadow. Hasil clean, cerah, modern, biasanya buat iklan atau fashion." },
  { name: "Low Key Lighting", description: "Cahaya minim, dominasi shadow. Memberikan kesan dramatis, misterius, atau sinematik." },
  { name: "Hard Light", description: "Cahaya tajam dari sumber kecil/langsung (misalnya lampu tanpa diffuser). Bayangan keras, kontras tinggi." },
  { name: "Soft Light", description: "Cahaya lembut dari sumber besar/diffused (softbox, cloud). Bayangan halus, natural." },
  { name: "Backlighting", description: "Cahaya dari belakang subjek. Bisa menghasilkan siluet atau efek rim light (garis cahaya di pinggir tubuh)." },
  { name: "Side Lighting", description: "Cahaya dari samping. Memberi dimensi, tekstur, dan kedalaman." },
  { name: "Top Lighting", description: "Cahaya dari atas langsung. Kesan dramatis, sering dipakai di film thriller atau spotlight." },
  { name: "Under Lighting", description: "Cahaya dari bawah. Memberi kesan menyeramkan atau eksperimental." },
  { name: "Practical Lighting", description: "Menggunakan lampu asli di lokasi (lampu meja, neon, lilin) untuk menambah mood realistis." },
  { name: "Motivated Lighting", description: "Cahaya buatan diset agar terlihat alami (misalnya lampu studio diarahkan supaya seolah-olah dari jendela)." },
  { name: "Rim Lighting", description: "Cahaya dari belakang/samping untuk memberi outline bercahaya di subjek. Efek elegan dan cinematic." },
  { name: "Silhouette Lighting", description: "Subjek gelap dengan background terang. Kesan dramatis, misterius, atau romantis." },
  { name: "Bounce Lighting", description: "Cahaya dipantulkan ke permukaan (tembok, reflector, kain putih) untuk hasil lebih lembut dan natural." }
];

export const aspectRatios: string[] = [
  "Original",
  "1:1 (Square)",
  "4:5 (Portrait)",
  "9:16 (Story)",
  "3:4 (Classic Portrait)",
  "16:9 (Widescreen)",
  "4:3 (Classic Landscape)",
];

export const imageStyles = [
  { name: 'Pilih Style', description: 'Gunakan gaya rendering default.', promptValue: '' },
  { name: 'Realism (Realistis)', description: 'Gaya gambar yang berusaha mirip kenyataan, detail, tekstur, dan cahaya dibuat persis seperti di dunia nyata. → Cocok untuk foto produk, potret, arsitektur.', promptValue: 'Realism' },
  { name: 'Surrealism (Surealis)', description: 'Gaya fantasi yang menggabungkan realitas dengan hal-hal tidak masuk akal atau mimpi. → Cocok untuk karya seni unik, cover album, atau visual eksperimental.', promptValue: 'Surrealism' },
  { name: 'Minimalism (Minimalis)', description: 'Gaya sederhana dengan elemen terbatas, warna sedikit, fokus pada clean look. → Cocok untuk branding, fashion, desain modern.', promptValue: 'Minimalism' },
  { name: 'Flat Design', description: 'Gambar 2D tanpa bayangan kompleks, warna cerah, clean, biasanya untuk ilustrasi digital. → Cocok untuk infografis, UI/UX, ikon.', promptValue: 'Flat Design' },
  { name: 'Vector Art', description: 'Gaya ilustrasi berbasis garis dan bentuk tajam, scalable tanpa pecah. → Cocok untuk logo, poster, desain grafis.', promptValue: 'Vector Art' },
  { name: 'Cartoon / Comic Style', description: 'Gambar karakter lucu atau bergaya komik, dengan outline jelas dan ekspresi berlebihan. → Cocok untuk konten hiburan, iklan fun, atau storytelling.', promptValue: 'Cartoon / Comic Style' },
  { name: 'Watercolor Style (Cat Air)', description: 'Efek lembut seperti lukisan cat air, warna gradasi alami. → Cocok untuk undangan, ilustrasi buku, atau desain artistik.', promptValue: 'Watercolor Style' },
  { name: 'Line Art / Sketch', description: 'Menggunakan garis sederhana, bisa hitam-putih atau dengan sedikit warna. → Cocok untuk ilustrasi cepat, fashion sketch, atau logo artistik.', promptValue: 'Line Art / Sketch' },
  { name: 'Cinematic Style', description: 'Mengikuti gaya film: kontras dramatis, tone warna khas (teal-orange, noir, dsb). → Cocok untuk poster, promosi, atau foto bergaya film.', promptValue: 'Cinematic Style' },
  { name: '3D Rendering / CGI', description: 'Gambar dibuat dengan software 3D, hasilnya realistis atau stylized dengan dimensi ruang. → Cocok untuk produk, arsitektur, animasi, atau iklan.', promptValue: '3D Rendering / CGI' }
];

export const imageStylesForGenerator = [
    { name: 'Original', description: 'Gaya rendering default.', promptValue: '' },
    ...imageStyles.filter(style => style.name !== 'Pilih Style')
];
