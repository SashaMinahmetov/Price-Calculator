import { TelegramUser } from '../types';
import { db, auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const logUserVisit = async (user: TelegramUser): Promise<string | null> => {
  try {
    // 1. Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const firebaseUser = userCredential.user;

    // 2. Check if we already logged this session
    const sessionKey = `logged_session_${user.id}`;
    let role = 'user';

    // 3. Update or create user document in Firestore
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const now = new Date().toISOString();

    if (userSnap.exists()) {
      // Update existing user
      const data = userSnap.data();
      role = data.role || 'user';
      
      if (!sessionStorage.getItem(sessionKey)) {
        await updateDoc(userRef, {
          firstName: user.first_name,
          lastName: user.last_name || '',
          username: user.username || '',
          languageCode: user.language_code || '',
          lastVisit: now,
          visitCount: (data.visitCount || 0) + 1
        });
      }
    } else {
      // Create new user
      if (!sessionStorage.getItem(sessionKey)) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          telegramId: user.id,
          firstName: user.first_name,
          lastName: user.last_name || '',
          username: user.username || '',
          languageCode: user.language_code || '',
          lastVisit: now,
          visitCount: 1,
          role: 'user'
        });
      }
    }

    sessionStorage.setItem(sessionKey, 'true');
    console.log("Analytics: User visit logged to Firebase");
    return role;
  } catch (error) {
    console.error("Analytics: Failed to log visit to Firebase", error);
    return null;
  }
};