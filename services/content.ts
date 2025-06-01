

/**
 * Service to handle loading content from text files
 */
class ContentService {
  // Cache the content to avoid reading it multiple times
  private manualContent: string | null = null;

  /**
   * Loads the content of the defense manual from assets
   */
  async loadDefenseManualContent(): Promise<string> {
    try {
      // If we already have the content cached, return it
      if (this.manualContent) {
        return this.manualContent;
      }

      // For this example, we're returning the content directly from the assets/content.txt file
      // In a real app with a large file, we would implement proper file reading
      
      // This is the content from assets/content.txt
      this.manualContent = `Self-Defense Manual for Women

Stay Safe, Stay Empowered
A Layman-Friendly Guide to Personal Safety and Basic Self-Defense Techniques

Created by Grok, xAI
May 2025

Contents
1 Introduction
2 Key Principles of Self-Defense
3 Situational Awareness: Your First Line of Defense
4 Using Your Voice and Body Language
5 Basic Physical Self-Defense Techniques
5.1 Palm Strike
5.2 Knee Strike
5.3 Wrist Escape
5.4 Improvised Weapons
6 Dealing with Common Scenarios
7 Empowerment and Confidence
8 Resources for Further Learning
9 Conclusion

Introduction
This manual is designed for women who want to feel safer and more confident in their daily lives. You don't need to be an athlete or have martial arts experience to use these techniques. The goal is to teach you simple, effective ways to stay aware, avoid danger, and protect yourself if needed. Self-defense is about empowerment, awareness, and preparation—not just fighting.

Key Principles of Self-Defense
Self-defense is more than physical moves. It's about mindset, awareness, and confidence. Here are the core ideas to keep in mind:

Stay Aware: Pay attention to your surroundings to spot potential risks early.

Trust Your Instincts: If something feels wrong, it probably is. Act on that feeling.

Use Your Voice: A loud "No!" or "Stop!" can deter an attacker and attract help.

Escape is the Goal: Your priority is to get away safely, not to "win" a fight.

Confidence Matters: Standing tall and acting assertive can make you less of a target.

Situational Awareness: Your First Line of Defense
Being aware of your environment is the best way to prevent danger. Here's how to practice situational awareness:

Scan Your Surroundings: Look around when walking, especially in unfamiliar or isolated areas. Notice people, exits, and potential hiding spots.

Avoid Distractions: Keep your phone in your pocket and earbuds out when in public to stay alert.

Plan Your Route: Stick to well-lit, populated areas. Tell someone your plans if you're going out alone.

Trust Your Gut: If a person or place feels unsafe, leave or change your path immediately.

Tip: Practice scanning your surroundings daily. For example, when entering a parking lot, note where cars and people are. This builds a habit of awareness.

Using Your Voice and Body Language
Your voice and posture can prevent a situation from escalating. Here's how to use them effectively:

Be Loud and Firm: If someone approaches you in a threatening way, yell "Back off!" or "Leave me alone!" This can scare them away and alert others.

Stand Tall: Keep your shoulders back, head up, and make eye contact. This shows confidence and makes you less likely to be targeted.

Set Boundaries: If someone is too close, say, "Please give me space," in a calm but firm tone.

Practice: Try saying "No!" or "Stop!" loudly at home. It feels awkward at first, but it builds confidence for real situations.

Basic Physical Self-Defense Techniques
These techniques are simple, effective, and don't require advanced training. Always aim to escape after using them. Practice these moves slowly with a friend or in front of a mirror.`;
      
      return this.manualContent;
    } catch (error) {
      console.error('Error loading defense manual content:', error);
      throw error;
    }
  }
}

export default new ContentService();