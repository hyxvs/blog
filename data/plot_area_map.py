import json
import matplotlib.pyplot as plt
from shapely.geometry import Polygon

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 读取行政区划数据
with open('章贡区.geojson', 'r', encoding='utf-8') as f:
    area_data = json.load(f)

# 绘制章贡区整体形态（显示各镇边界）
fig, ax = plt.subplots(figsize=(12, 10))

# 定义颜色列表
colors = ['#4169E1', '#32CD32', '#9932CC', '#FF6347', '#FFD700',
          '#00CED1', '#ADFF2F', '#FF69B4', '#FF8C00', '#DA70D6',
          '#1E90FF', '#7CFC00', '#BA55D3', '#FF7F50', '#FF1493']

# 逐个绘制各镇/街道
for i, feature in enumerate(area_data['features']):
    name = feature['properties']['name']
    geom = feature['geometry']
    color = colors[i % len(colors)]
    
    if geom['type'] == 'Polygon':
        polygon = Polygon(geom['coordinates'][0])
        x, y = polygon.exterior.xy
        ax.fill(x, y, alpha=0.5, fc=color, ec='black', linewidth=1.5)
        # 添加镇名标签（在质心位置）
        centroid = polygon.centroid
        ax.text(centroid.x, centroid.y, name, fontsize=7, ha='center', va='center')
    elif geom['type'] == 'MultiPolygon':
        for coords in geom['coordinates']:
            polygon = Polygon(coords[0])
            x, y = polygon.exterior.xy
            ax.fill(x, y, alpha=0.5, fc=color, ec='black', linewidth=1.5)
        # 添加镇名标签（在第一个多边形质心位置）
        first_poly = Polygon(geom['coordinates'][0][0])
        centroid = first_poly.centroid
        ax.text(centroid.x, centroid.y, name, fontsize=14, ha='center', va='center')

ax.set_xlabel('经度')
ax.set_ylabel('纬度')
ax.set_title('章贡区行政区划分布图（含各镇边界）')
ax.grid(True, alpha=0.3)
ax.set_aspect('equal')
plt.tight_layout()
fig.savefig('面状分布测度_章贡区行政区划.png', dpi=150, bbox_inches='tight')
print("面状分布测度图已保存：面状分布测度_章贡区行政区划.png")
