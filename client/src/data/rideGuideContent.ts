export interface RideGuideStep {
  title: string;
  description: string;
}

export interface RideGuide {
  id: string;
  steps: RideGuideStep[];
  tips: string[];
  androidLink?: string;
  iosLink?: string;
  phoneNumber?: string;
}

export const rideGuides: Record<string, RideGuide> = {
  angkas: {
    id: 'angkas',
    steps: [
      {
        title: 'Download the Angkas app',
        description: 'Install Angkas from the Google Play Store or Apple App Store and create an account with your mobile number.',
      },
      {
        title: 'Set your pickup and drop-off',
        description: 'Open the app, allow location access, then enter where you are and where you want to go in Batangas City.',
      },
      {
        title: 'Confirm the fare and book',
        description: 'Review the upfront fare estimate, then tap Book. A certified biker will accept and head to your pickup point.',
      },
      {
        title: 'Wear the helmet and verify the rider',
        description: 'Check the rider name, plate number, and OTP in the app before getting on. Use the helmet provided with a fresh hairnet.',
      },
      {
        title: 'Pay and rate your trip',
        description: 'Pay via GCash, Maya, or cash as shown in the app. Rate your biker when you arrive.',
      },
    ],
    tips: [
      'Best for solo trips during rush hour on Diversion Road and Kumintang.',
      'Keep your phone charged — the app tracks your ride in real time.',
      'Avoid booking if you have heavy luggage; use a taxi instead.',
    ],
    androidLink: 'https://play.google.com/store/apps/details?id=com.angkas.passenger',
    iosLink: 'https://apps.apple.com/app/angkas-book-a-motorbike-ride/id1227390352',
  },
  grab: {
    id: 'grab',
    steps: [
      {
        title: 'Download the Grab app',
        description: 'Get Grab from your app store and sign up with your phone number or social account.',
      },
      {
        title: 'Choose GrabCar or GrabTaxi',
        description: 'On the home screen, select GrabCar for private rides or GrabTaxi for metered taxi service in Batangas.',
      },
      {
        title: 'Enter pickup and destination',
        description: 'Pin your location on the map or type an address — e.g. SM Batangas, Grand Terminal, or Batangas Port.',
      },
      {
        title: 'Review fare and confirm',
        description: 'Grab shows an upfront fare for GrabCar. For GrabTaxi, the meter applies plus any booking fee shown in the app.',
      },
      {
        title: 'Track your driver and pay',
        description: 'Follow the driver on the map, verify their name and plate, then pay via GrabPay, GCash, or cash.',
      },
    ],
    tips: [
      'Ideal for airport or port transfers with luggage.',
      'GrabCar works well for families and groups of up to 4.',
      'Enable cashless payment in the app to avoid needing exact change.',
    ],
    androidLink: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger',
    iosLink: 'https://apps.apple.com/app/grab-taxi-ride-food-delivery/id647268330',
  },
  'idol-taxi': {
    id: 'idol-taxi',
    steps: [
      {
        title: 'Call or message Idol Taxi',
        description: 'Contact the Batangas City dispatch line or use their Facebook page to request a metered taxi.',
      },
      {
        title: 'Give your pickup location clearly',
        description: 'Share a landmark — e.g. Batangas Grand Terminal, SM City, Port of Batangas, or your barangay and street.',
      },
      {
        title: 'Confirm metered fare or estimate',
        description: 'Ask if they can give an estimated range for your route. Standard trips use the taxi meter from pickup.',
      },
      {
        title: 'Wait at a safe, visible spot',
        description: 'Stand where drivers can easily pull over. Note the taxi plate number when the driver confirms arrival.',
      },
      {
        title: 'Pay the metered fare plus any extras',
        description: 'Pay in cash at the end of the trip. Tipping is optional but appreciated for good service.',
      },
    ],
    tips: [
      'Reliable for Grand Terminal and port passenger pickups.',
      'Book ahead for early-morning or late-night trips.',
      'Keep small bills ready — drivers may not have change for large notes.',
    ],
    phoneNumber: '0917-XXX-XXXX',
  },
};
