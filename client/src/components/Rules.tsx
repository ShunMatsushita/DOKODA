interface Props {
  onClose: () => void;
}

export default function Rules({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 950,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          padding: 'clamp(16px, 4vw, 32px)',
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          color: 'var(--text-primary)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>
            DOKODA のルール
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <Section title="基本ルール">
          <p>どの2枚のカードにも、<strong style={{ color: 'var(--warning)' }}>必ず1つだけ共通のシンボル</strong>があります。</p>
          <p>他のプレイヤーより先に共通シンボルを見つけてタップしましょう！</p>
        </Section>

        <Section title="ザ・タワー">
          <p>中央のカードと自分の手札の一番上のカードを見比べます。</p>
          <p>共通シンボルを見つけたらタップ！ 正解すると自分のカードが中央に移動します。</p>
          <p style={{ color: 'var(--success)' }}>手札を一番早くなくした人の勝ち！</p>
        </Section>

        <Section title="ザ・ウェル">
          <p>中央の山札から1枚ずつカードがめくられます。</p>
          <p>自分の手元のカードと中央カードの共通シンボルを見つけてタップ！</p>
          <p style={{ color: 'var(--success)' }}>一番多くカードを獲得した人の勝ち！</p>
        </Section>

        <Section title="タイムアタック（協力モード）">
          <p>全員で協力して、制限時間内に全カードのクリアを目指します！</p>
          <p>中央カードと自分のカードの共通シンボルを見つけてタップ。正解すると山札から次のカードが補充されます。</p>
          <p>山札がなくなれば<strong style={{ color: 'var(--success)' }}>全クリア</strong>！ 1人でも挑戦できます。</p>
          <p style={{ color: 'var(--warning)' }}>制限時間はホストが30秒〜5分で設定可能。</p>
        </Section>

        <Section title="お手付き">
          <p>間違ったシンボルをタップすると、一定時間操作できなくなります。</p>
          <p>ペナルティ時間はホストが設定できます（0秒〜5秒）。</p>
        </Section>

        <Section title="操作方法">
          <p>カード上のシンボルを直接タップ／クリックして回答します。</p>
          <p>2枚のカードに共通するシンボルをタップしてください。</p>
        </Section>

        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--accent-light)',
        marginBottom: 8,
        borderBottom: '1px solid rgba(233, 69, 96, 0.3)',
        paddingBottom: 4,
      }}>
        {title}
      </h3>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}
