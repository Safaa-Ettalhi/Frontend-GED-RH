import { Metadata } from 'next'
import JobOffersClient from './job-offers-client'

export const metadata: Metadata = {
  title: 'Offres d\'Emploi - GEDPro',
  description: 'Découvrez les opportunités qui vous correspondent',
}

async function fetchJobOffers() {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const url = `${baseURL}/forms/job-offers/public`
    
    const response = await fetch(url, {
      cache: 'no-store', 
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    })
    
    if (!response.ok) {
      console.error(`Error fetching job offers: ${response.status} ${response.statusText}`)
      return []
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching job offers in SSR:', error)
    return []
  }
}

export default async function JobOffersPage() {
  const jobOffers = await fetchJobOffers()

  return <JobOffersClient initialJobOffers={jobOffers} />
}
