# Voice ಖಾತರಿ (Voice Khatari)

### Your Shop. Your Voice. Your Trusted Khata.

**A free, offline-first, multilingual digital ledger for small kirana stores in India.**

---

## About the Project

Voice ಖಾತರಿ (Voice Khatari) is an offline-first, voice-enabled digital khata designed to simplify credit and payment management for small kirana stores in India.

Many local shopkeepers still maintain customer credit records using handwritten notebooks, paper slips or memory. This can result in incorrect balances, missing transactions, difficulty tracking payments and disputes between shopkeepers and customers.

Voice ಖಾತರಿ aims to make digital bookkeeping as simple as having a conversation.

Shopkeepers will be able to record customer credit, update payments, check outstanding balances and retrieve transaction summaries using voice commands in supported Indian languages.

Unlike cloud-dependent voice applications, Voice ಖಾತರಿ is being developed with an **offline-first approach**, prioritising local processing, device-based storage and privacy.

## Our Vision

To make digital bookkeeping accessible to every small shopkeeper, regardless of internet connectivity, technical experience or language preference.

## Key Features

### Core Ledger Features
- **Digital Khata:** Maintain customer-wise credit and payment records.
- **Customer Management:** Add, search and manage customer details.
- **Transaction History:** View individual customer transactions.
- **Balance Tracking:** Calculate outstanding customer balances.
- **Transaction Corrections:** Correct transaction details before saving.
- **Daily Summaries:** View daily credit, payment and outstanding totals.

### Voice Features
- **Voice-Based Transactions:** Record credit and payments through natural speech.
- **Multilingual Interaction:** Target support for Kannada, Hindi and English.
- **Smart Customer Identification:** Identify customers and clarify duplicate names.
- **Context-Aware Corrections:** Understand corrections before confirming transactions.
- **Voice-Based Queries:** Retrieve customer balances and transaction summaries through speech.
- **Spoken Responses:** Provide audio feedback to shopkeepers.

### Offline-First Features
- **Local Data Storage:** Store customer and transaction information on the device.
- **Offline Access:** Access core ledger functionality without an internet connection.
- **Progressive Web App:** Install the application on supported devices.
- **Local Voice Processing:** Aim to process speech without sending recordings to cloud APIs.
- **Privacy-Focused Design:** Minimise external data sharing and unnecessary data collection.

## How It Works

The intended transaction workflow:

1. **Voice Input:** The shopkeeper speaks through the application's microphone.
2. **Speech Recognition:** A locally running speech recognition engine converts speech into text.
3. **Transaction Understanding:** The application identifies the customer, amount, transaction type and relevant date.
4. **Validation:** Customer identity and transaction details are checked.
5. **Confirmation:** The shopkeeper confirms or corrects the transaction.
6. **Local Ledger Update:** The validated transaction is saved to the device's local database.
7. **Voice Response:** A local text-to-speech engine provides spoken confirmation.

Example:

**Shopkeeper:** "Ramesh ge 500 rupaayi udhaar haaku."

**Voice Khatari:** "Ramesh ge 500 rupaayi udhaar add maadalaa?"

The transaction is saved only after confirmation.

## System Architecture

Voice ಖಾತರಿ follows an offline-first Progressive Web App architecture.

```text
          Shopkeeper
               |
               v
        Voice / Text Input
               |
               v
     Local Speech Recognition
               |
               v
      Transaction Understanding
               |
               v
        Validation & Confirmation
               |
               v
       Local Ledger Management
               |
               v
        IndexedDB Database
               |
               v
       Local Speech Response
               |
               v
          Shopkeeper
```

The application is designed to keep its core ledger functionality independent of external AI APIs and cloud services.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Development Server | Vite |
| Styling | CSS |
| Icons | Lucide React |
| PWA | Vite PWA Plugin |
| Local Database | IndexedDB |
| Database Wrapper | Dexie.js |
| Speech Recognition | Open-source local speech recognition |
| Text-to-Speech | Local/device-based speech synthesis |
| Language Processing | Local transaction parsing and validation |
| Version Control | Git and GitHub |

*The voice recognition engine and multilingual speech models are subject to implementation and device compatibility testing.*

## Offline-First Approach

Voice ಖಾತರಿ is designed to work without continuous internet connectivity.

After the initial installation and download of required application assets and speech models:

- The application can reopen without internet access.
- Customer information remains stored locally.
- Transactions can be created and viewed offline.
- Customer balances can be calculated locally.
- Voice processing is intended to run on the device.
- The application can provide spoken responses using available local voices.

Internet connectivity may still be required for initial installation, model downloads, application updates and optional backup or synchronisation features.

## Privacy and Security

Privacy is an important part of the Voice ಖಾತರಿ design.

- No paid third-party AI APIs are required for the planned core functionality.
- Customer and transaction data are intended to remain on the user's device.
- Voice recordings should not be uploaded to external services.
- Transactions must be validated before being saved.
- Sensitive information should not be exposed in application logs.
- Local data export and backup will be supported.
- Future synchronisation features, if introduced, must be optional and privacy-conscious.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- Visual Studio Code or Google Antigravity
- A modern browser

### Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd voice-khatari
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Production Build

To create a production build:

```bash
npm run build
```

## Development Roadmap

- [x] Initial React frontend
- [x] Dashboard and core screen design
- [ ] Functional customer management
- [ ] Local transaction management
- [ ] IndexedDB integration
- [ ] Progressive Web App configuration
- [ ] Offline application caching
- [ ] Local speech recognition
- [ ] Kannada voice recognition testing
- [ ] Hindi and English voice recognition testing
- [ ] Local text-to-speech integration
- [ ] Voice-based transaction confirmation
- [ ] Offline testing and optimisation
- [ ] Data export and backup

## Future Enhancements

- Improved Kannada-English code-mixed speech recognition.
- Better handling of noisy shop environments.
- Faster local speech processing on low-end devices.
- Optional encrypted backup and data synchronisation.
- Improved accessibility and multilingual user experience.

## Project Status

**Status:** In Development

Voice ಖಾತರಿ is currently being developed as a free, offline-first Progressive Web App. The initial frontend is being extended with local database functionality, offline support and on-device voice capabilities.

Features listed in the roadmap are planned and should not be considered fully implemented until tested.

## Project Identity

**Project Name:** Voice ಖಾತರಿ (Voice Khatari)

**Tagline:** Your Shop. Your Voice. Your Trusted Khata.

**Target Users:** Small kirana store owners and neighbourhood retailers in India.

**Primary Goal:** Simplify customer credit and payment management through accessible, voice-first digital bookkeeping.

---

*Built with the vision of making everyday digital bookkeeping simple, accessible and independent of internet connectivity.*
