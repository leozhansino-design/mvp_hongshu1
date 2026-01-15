'use client';

interface FiveElementsProps {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export default function FiveElementsDiagram({ wood, fire, earth, metal, water }: FiveElementsProps) {
  const elements = [
    { key: 'fire', label: '火', value: fire, color: '#ef4444', textColor: '#fca5a5', angle: 0 },
    { key: 'earth', label: '土', value: earth, color: '#eab308', textColor: '#fde047', angle: 72 },
    { key: 'metal', label: '金', value: metal, color: '#d1d5db', textColor: '#f3f4f6', angle: 144 },
    { key: 'water', label: '水', value: water, color: '#3b82f6', textColor: '#93c5fd', angle: 216 },
    { key: 'wood', label: '木', value: wood, color: '#22c55e', textColor: '#86efac', angle: 288 },
  ];

  const centerX = 200;
  const centerY = 200;
  const radius = 120;

  // 计算每个元素的位置
  const getPosition = (angle: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  // 相生关系 (外圈五边形) - 顺时针
  const generationPairs = [
    [0, 4], // 火生土
    [4, 3], // 土生金
    [3, 2], // 金生水
    [2, 1], // 水生木
    [1, 0], // 木生火
  ];

  // 相克关系 (内部五角星) - 跳一个
  const controlPairs = [
    [0, 2], // 火克金
    [2, 1], // 金克木
    [1, 4], // 木克土
    [4, 3], // 土克水
    [3, 0], // 水克火
  ];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-md">
        {/* 背景圆 */}
        <circle cx={centerX} cy={centerY} r={radius + 40} fill="none" stroke="#374151" strokeWidth="1" opacity="0.3" />

        {/* 相生关系线 (外圈五边形 - 绿色) */}
        {generationPairs.map(([from, to], i) => {
          const fromPos = getPosition(elements[from].angle);
          const toPos = getPosition(elements[to].angle);
          return (
            <g key={`gen-${i}`}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#22c55e"
                strokeWidth="2"
                opacity="0.4"
              />
              {/* 箭头 */}
              <polygon
                points={`${toPos.x},${toPos.y} ${toPos.x - 5},${toPos.y - 5} ${toPos.x - 5},${toPos.y + 5}`}
                fill="#22c55e"
                opacity="0.4"
                transform={`rotate(${elements[to].angle - 90}, ${toPos.x}, ${toPos.y})`}
              />
            </g>
          );
        })}

        {/* 相克关系线 (内部五角星 - 红色) */}
        {controlPairs.map(([from, to], i) => {
          const fromPos = getPosition(elements[from].angle);
          const toPos = getPosition(elements[to].angle);
          return (
            <g key={`ctrl-${i}`}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.3"
                strokeDasharray="4,4"
              />
            </g>
          );
        })}

        {/* 五行元素圆点 */}
        {elements.map((el, i) => {
          const pos = getPosition(el.angle);
          return (
            <g key={el.key}>
              {/* 外圈光晕 */}
              <circle cx={pos.x} cy={pos.y} r={32} fill={el.color} opacity="0.15" />

              {/* 主圆 */}
              <circle cx={pos.x} cy={pos.y} r={28} fill="#000000" stroke={el.color} strokeWidth="2" />

              {/* 文字标签 */}
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                fill={el.textColor}
                fontSize="18"
                fontWeight="bold"
              >
                {el.label}
              </text>

              {/* 数值 */}
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="20"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {el.value}
              </text>
            </g>
          );
        })}

        {/* 中心说明文字 */}
        <text x={centerX} y={centerY - 10} textAnchor="middle" fill="#9ca3af" fontSize="14">
          五行生克
        </text>
        <text x={centerX} y={centerY + 10} textAnchor="middle" fill="#22c55e" fontSize="11">
          ━ 相生
        </text>
        <text x={centerX} y={centerY + 25} textAnchor="middle" fill="#ef4444" fontSize="11">
          ┅ 相克
        </text>
      </svg>

      {/* 图例说明 */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>相生: 木→火→土→金→水</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500 opacity-60" style={{ borderTop: '1px dashed' }}></div>
          <span>相克: 木→土→水→火→金</span>
        </div>
      </div>
    </div>
  );
}
