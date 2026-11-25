[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/iwanr94/best-cooking-game/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/iwanr94/best-cooking-game/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

# Dapur Kilat — Warung Cepat Saji

Game memasak orisinal untuk bounty [Make the best cooking game](https://make.fun/c/best-cooking-game-20261125-0137) di make.fun ($250, top 10 berbagi).

Kamu juru masak di sebuah warung cepat saji. Pesanan datang di papan pesanan — ambil bahan dari peti, potong di talenan, goreng di kompor, rakit hidangan di Meja Racik, lalu antar ke jendela LAYANAN sebelum kesabaran pelanggan habis. Satu shift 150 detik; makin lama makin ramai, pesanan makin cepat datang dan makin singkat sabarnya.

## Cara main

- **WASD / panah**: jalan
- **E / Spasi**: pakai stasiun (tahan di talenan untuk memotong)
- **Klik mouse**: jalan ke sana (klik stasiun untuk langsung menggunakannya)
- **P**: jeda

Alur masak: nasi langsung siap saji, telur digoreng, ayam dipotong lalu digoreng, cabai dan sayur dipotong. Jangan biarkan gorengan terlalu lama di kompor — gosong! Antar hidangan yang tepat untuk dapat koin + tip, dan antar beruntun untuk kombo.

## Menu

| Hidangan | Bahan |
| --- | --- |
| Nasi Telur | nasi + telur goreng |
| Nasi Sayur | nasi + sayur cincang |
| Nasi Goreng | nasi + telur goreng + cabai cincang |
| Ayam Geprek | ayam cincang goreng + cabai cincang |
| Sayur Ayam | ayam cincang goreng + sayur cincang |

## Menjalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Game berupa file statis di `game/` — tanpa build step, tanpa network request, semua gambar digambar di canvas dan semua suara disintesis dengan WebAudio. Screenshot di `screenshots/` adalah render asli dari kode game (`?shot=play|serve|rush|start&seed=7`).

## Hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` menyalin `game/` dan `screenshots/` ke `/output` dan menulis `dossier.json` dengan `vendor/makefun-game.ts` dari kit.
