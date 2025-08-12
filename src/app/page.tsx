'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-pink-600 p-4 md:p-8 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Wedding banner" 
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-lg"
            >
              Dobrodošli na naše vjenčanje
            </motion.h1>
          </div>
        </div>
        
        <div className="p-6 md:p-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed"
          >
            Oduševljeni smo što možete proslaviti vašu sretnu noć s nama! Istražite i preuzmite slike koje su zabilježili vaši gosti po simboličnoj cijeni od <span className="font-bold text-pink-600">150KM</span>.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-purple-50 rounded-xl p-6 mb-10 border-l-4 border-purple-500 shadow-sm"
          >
            <p className="text-lg text-purple-800">
              Za svako vjenčanje dobijate jedinstveni QR kod koji vas preusmjerava na personaliziranu stranicu vašeg vjenčanja.
            </p>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-2xl font-bold text-gray-800 mb-6 text-center"
          >
            Pogledajte naše primjere
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                src: "https://www.selfiewall.net/en/elements/galerie_pictures/selfiewall_wedding-game_icebraker.jpg",
                alt: "Slika vjenčanja 1",
                title: "Trenutci sreće"
              },
              {
                src: "https://storage.bljesak.info/image/246074/1280x880/selfie-vjencanje-svatovi.jpg",
                alt: "Slika vjenčanja 2",
                title: "Uspomene zauvijek"
              },
              {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzOtPj9IipJAFN4WphwAqMfj7dVtctp6MNFg&s",
                alt: "Slika vjenčanja 3",
                title: "Posebni trenuci"
              }
            ].map((image, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5 }}
                className="group relative rounded-xl overflow-hidden shadow-lg h-64"
              >
                <Image 
                  src={image.src} 
                  alt={image.alt} 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <h3 className="text-white font-bold text-lg mb-2">{image.title}</h3>
                  <Link href="#" className="inline-block bg-white text-purple-700 py-2 px-4 rounded-lg font-medium hover:bg-purple-100 transition-colors duration-300">
                    Pogledaj detalje
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mt-10 text-center space-y-6"
          >
            <div>
              <Link 
                href="/contact" 
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Kontaktirajte nas
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
