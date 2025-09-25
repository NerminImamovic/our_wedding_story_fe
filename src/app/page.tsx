'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
// import AuthorizeButton from './user/AuthorizeButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-100 to-pink-200 flex items-center justify-center py-8 px-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left: Banner & Welcome */}
        <div className="relative md:w-1/2 h-64 md:h-auto flex-shrink-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Wedding banner"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold mb-1 drop-shadow-lg"
            >
              Sva vaša sjećanja sa vjenčanja na jednom mjestu
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-base md:text-lg text-gray-100"
            >
              Naš proizvod omogućava mladencima da na jednom mjestu prikupe sve slike sa vjenčanja – direktno na Google Drive! Gosti jednostavno uploaduju slike, a vi ih pregledate i preuzimate kad god želite.
            </motion.p>
          </div>
        </div>

        {/* Right: Product-Oriented Content */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed"
            >
              Zaboravite na izgubljene uspomene! Naš sistem automatski prikuplja sve slike koje vaši gosti uploaduju putem personalizirane stranice i čuva ih na vašem Google Drive-u. Sve fotografije su sigurne, organizovane i dostupne samo vama.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-5 mb-8 border-l-4 border-purple-400 shadow"
            >
              <p className="text-base md:text-lg text-purple-800">
                <span className="font-semibold">Kako funkcioniše?</span> Svako vjenčanje dobija svoj QR kod i link. Gosti skeniraju kod, uploaduju slike, a vi ih odmah vidite na svom Google Drive-u – bez komplikacija, bez aplikacija!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-base md:text-lg">
                <li>
                  <span className="font-semibold text-pink-600">Jednostavno:</span> Gosti uploaduju slike sa svojih telefona ili računara.
                </li>
                <li>
                  <span className="font-semibold text-pink-600">Sigurno:</span> Sve slike se automatski spremaju na vaš Google Drive.
                </li>
                <li>
                  <span className="font-semibold text-pink-600">Privatno:</span> Samo vi imate pristup svim uspomenama.
                </li>
                <li>
                  <span className="font-semibold text-pink-600">Bez ograničenja:</span> Neograničen broj slika i gostiju.
                </li>
              </ul>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center"
            >
              Kako izgleda u praksi?
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {[
                {
                  src: "https://www.selfiewall.net/en/elements/galerie_pictures/selfiewall_wedding-game_icebraker.jpg",
                  alt: "Slika vjenčanja 1",
                  title: "Gosti uploaduju slike"
                },
                {
                  src: "https://storage.bljesak.info/image/246074/1280x880/selfie-vjencanje-svatovi.jpg",
                  alt: "Slika vjenčanja 2",
                  title: "Sve slike na jednom mjestu"
                },
                {
                  src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzOtPj9IipJAFN4WphwAqMfj7dVtctp6MNFg&s",
                  alt: "Slika vjenčanja 3",
                  title: "Mladenci pregledaju uspomene"
                }
              ].map((image, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="group relative rounded-xl overflow-hidden shadow-md h-44 md:h-48"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-white font-bold text-base mb-1">{image.title}</h3>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <Link
              href="/contact"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Saznajte više ili rezervišite demo
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
