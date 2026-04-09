import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: "top" | "bottom";
  /**
   * Render the picker in document.body and position with fixed coordinates above the anchor.
   * Use in narrow flex rows (e.g. forum composer) so width is not clamped to the emoji button column.
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
  detachToBody?: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  position = "bottom",
  anchorRef,
  detachToBody = false,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});

  // Common emojis organized by category
  const emojiCategories = {
    "Smileys & People": [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
      "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
      "🤧", "🥵", "🥶", "😶‍🌫️", "😵", "😵‍💫", "🤯", "🤠", "🥳", "😎",
      "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳",
      "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖",
      "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬",
      "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽",
      "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿",
      "😾",
    ],
    "Gestures & Body": [
      "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
      "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
      "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃",
      "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋",
      "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔",
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💯",
    ],
    "Animals & Nature": [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
      "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
      "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
      "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙",
      "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋",
      "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏",
      "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖",
      "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈",
      "🐈‍⬛", "🪶", "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊️",
      "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿️",
      "🦔", "🌲", "🌳", "🌴", "🌵", "🌶️", "🌷", "🌹", "🌺", "🌻",
      "🌼", "🌽", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃",
    ],
    "Food & Drink": [
      "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏",
      "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑",
      "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄",
      "🧅", "🍄", "🥜", "🌰", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯",
      "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟",
      "🍕", "🫔", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘",
      "🥫", "🫕", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪",
      "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧",
      "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫",
      "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "🫖", "☕",
      "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃",
      "🍸", "🍹", "🧉", "🍾", "🧊",
    ],
    "Activities": [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🏹", "🎣",
      "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️",
      "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤾", "🏌️", "🏇",
      "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇",
      "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹",
      "🎭", "🩰", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷",
      "🎺", "🎸", "🪗", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰",
      "🧩",
    ],
    "Travel & Places": [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼",
      "🚁", "🛸", "✈️", "🛫", "🛬", "🪂", "💺", "🚀", "🚡", "🚠",
      "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆",
      "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🚀", "🚁",
      "🛸", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛵", "🛶", "🚣",
      "🛟", "🚁", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬",
      "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️",
      "⛪", "🕌", "🕍", "🛕", "🕋", "⛩️", "🛤️", "🛣️", "🗾", "🎑",
      "🏞️", "🌅", "🌄", "🌠", "🎇", "🎆", "🌇", "🌆", "🏙️", "🌃",
      "🌌", "🌉", "🌁",
    ],
    "Objects": [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
      "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️",
      "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️",
      "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌", "💡",
      "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷",
      "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️",
      "🛠️", "⛏️", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲", "🔫",
      "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🪦",
      "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️",
      "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️",
      "🧹", "🪠", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁", "🛀", "🧼",
      "🪥", "🪒", "🧴", "🧷", "🧹", "🪣", "🧯", "🛒", "🚬", "⚰️",
    ],
    "Symbols": [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
      "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
      "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
      "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳",
      "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️",
      "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️",
      "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️",
      "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓",
      "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️",
      "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠",
      "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂",
      "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶",
      "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒",
      "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣",
      "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️",
      "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼",
      "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️",
      "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃",
      "🎵", "🎶", "➕", "➖", "➗", "✖️", "💲", "💱", "™️", "©️",
      "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔜", "🔝", "〽️",
    ],
  };

  useLayoutEffect(() => {
    if (!isOpen || !detachToBody || !anchorRef?.current) {
      setFixedStyle({});
      return;
    }

    const updatePosition = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pickerWidth = Math.min(320, window.innerWidth - 16);
      let left = rect.right - pickerWidth;
      left = Math.max(8, Math.min(left, window.innerWidth - pickerWidth - 8));
      const gap = 8;
      const bottom = window.innerHeight - rect.top + gap;
      setFixedStyle({
        position: "fixed",
        left,
        bottom,
        width: pickerWidth,
        maxWidth: pickerWidth,
        minWidth: Math.min(280, pickerWidth),
        zIndex: 10050,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, detachToBody, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const pickerClassName = `emoji-picker ${position === "top" ? "emoji-picker--top" : "emoji-picker--bottom"} ${
    detachToBody ? "emoji-picker--detached" : ""
  }`;

  const pickerInner = (
    <div
      ref={pickerRef}
      className={pickerClassName}
      style={detachToBody ? fixedStyle : undefined}
    >
      <div className="emoji-picker__header">
        <h3>Emoji</h3>
        <button className="emoji-picker__close" onClick={onClose} aria-label="Close emoji picker">
          <X size={18} />
        </button>
      </div>
      <div className="emoji-picker__content">
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <div key={category} className="emoji-picker__category">
            <h4 className="emoji-picker__category-title">{category}</h4>
            <div className="emoji-picker__grid">
              {emojis.map((emoji, index) => (
                <button
                  key={`${category}-${index}`}
                  className="emoji-picker__emoji"
                  onClick={() => {
                    onEmojiSelect(emoji);
                    onClose();
                  }}
                  aria-label={`Select ${emoji} emoji`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (detachToBody && typeof document !== "undefined") {
    return createPortal(pickerInner, document.body);
  }

  return pickerInner;
};

export default EmojiPicker;

