'use client'

import React from 'react'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-8 flex items-center justify-center">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 text-center">Dobrodošli na naše vjenčanje</h1>
        <p className="text-lg text-gray-700 mb-6 text-center">
          Oduševljeni smo što možete proslaviti vašu sretnu noć s nama! Istražite i preuzmite  slike koje su zabilježili vaši gosti po simboličnoj cijeni od <span className="font-bold">99KM</span>.
        </p>
        <p className="text-lg text-gray-700 mb-6 text-center">
          Za svako vjenčanje dobijate QR kod koji vas preusmjerava na stranicu našeg vjenčanja.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="w-full group relative">
            <Image src="https://www.selfiewall.net/en/elements/galerie_pictures/selfiewall_wedding-game_icebraker.jpg" alt="Slika vjenčanja 1" width={300} height={200} className="rounded-lg transition-transform transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <button className="bg-white text-black py-2 px-4 rounded-lg">Pogledaj detalje</button>
            </div>
          </div>
          <div className="w-full group relative">
            <Image src="https://storage.bljesak.info/image/246074/1280x880/selfie-vjencanje-svatovi.jpg" alt="Slika vjenčanja 2" width={300} height={200} className="rounded-lg transition-transform transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <button className="bg-white text-black py-2 px-4 rounded-lg">Pogledaj detalje</button>
            </div>
          </div>
          <div className="w-full group relative">
            <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzOtPj9IipJAFN4WphwAqMfj7dVtctp6MNFg&s" alt="Slika vjenčanja 3" width={300} height={200} className="rounded-lg transition-transform transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <button className="bg-white text-black py-2 px-4 rounded-lg">Pogledaj detalje</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
