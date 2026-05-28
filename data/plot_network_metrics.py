import json
import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import LineString, Point

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def calculate_detour_index(line):
    """计算单条道路的迂回指数"""
    coords = list(line.coords)
    if len(coords) < 2:
        return 1.0
    
    start = Point(coords[0])
    end = Point(coords[-1])
    straight_dist = start.distance(end)
    
    if straight_dist <= 0:
        return 1.0
    
    return line.length / straight_dist

def calculate_network_dimension(lines):
    """计算网络分形维度"""
    if not lines:
        return 1.0
    
    # 获取所有坐标
    all_coords = []
    for line in lines:
        coords = list(line.coords)
        all_coords.extend(coords)
    
    coords_array = np.array(all_coords)
    min_x, min_y = coords_array.min(axis=0)
    max_x, max_y = coords_array.max(axis=0)
    
    width = max_x - min_x
    height = max_y - min_y
    area = width * height
    
    total_length = sum(line.length for line in lines)
    
    if area > 0 and total_length > 0 and width > 0:
        dimension = np.log(total_length) / np.log(width)
        return min(max(dimension, 1.0), 2.0)
    
    return 1.0

def plot_detour_index_map():
    """绘制迂回指数分布图"""
    # 读取道路数据
    with open('road.geojson', 'r', encoding='utf-8') as f:
        road_data = json.load(f)
    
    # 计算每条道路的迂回指数
    detour_indices = []
    lines = []
    
    for feature in road_data['features']:
        geom = feature['geometry']
        if geom['type'] == 'LineString':
            line = LineString(geom['coordinates'])
            di = calculate_detour_index(line)
            detour_indices.append(di)
            lines.append((line, di))
    
    # 设置颜色映射
    min_di = min(detour_indices)
    max_di = max(detour_indices)
    
    # 过滤极端值（前1%和后1%）
    sorted_di = sorted(detour_indices)
    lower_bound = sorted_di[int(len(sorted_di) * 0.01)]
    upper_bound = sorted_di[int(len(sorted_di) * 0.99)]
    
    print(f"迂回指数统计：")
    print(f"  最小值：{min_di:.4f}")
    print(f"  最大值：{max_di:.4f}")
    print(f"  平均值：{np.mean(detour_indices):.4f}")
    print(f"  中位数：{np.median(detour_indices):.4f}")
    
    # 创建图表
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # 1. 迂回指数分布图
    for line, di in lines:
        # 颜色映射：迂回指数越高越红
        normalized_di = min(max((di - lower_bound) / (upper_bound - lower_bound + 1e-10), 0), 1)
        color = (normalized_di, 0.2, 1 - normalized_di)  # 红-蓝渐变
        
        coords = list(line.coords)
        x = [c[0] for c in coords]
        y = [c[1] for c in coords]
        ax1.plot(x, y, color=color, linewidth=1)
    
    ax1.set_title('章贡区道路迂回指数分布图', fontsize=14)
    ax1.set_xlabel('经度')
    ax1.set_ylabel('纬度')
    ax1.set_aspect('equal')
    
    # 添加颜色条
    sm = plt.cm.ScalarMappable(cmap='coolwarm', norm=plt.Normalize(vmin=lower_bound, vmax=upper_bound))
    sm.set_array([])
    fig.colorbar(sm, ax=ax1, orientation='horizontal', pad=0.05, 
                 label=f'迂回指数（{lower_bound:.2f} - {upper_bound:.2f}）')
    
    # 2. 迂回指数频率分布
    ax2.hist(detour_indices, bins=50, color='skyblue', edgecolor='black')
    ax2.axvline(np.mean(detour_indices), color='red', linestyle='--', label=f'平均值: {np.mean(detour_indices):.2f}')
    ax2.axvline(np.median(detour_indices), color='green', linestyle='--', label=f'中位数: {np.median(detour_indices):.2f}')
    ax2.set_title('迂回指数频率分布', fontsize=14)
    ax2.set_xlabel('迂回指数')
    ax2.set_ylabel('道路数量')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('线状分布_迂回指数分布图.png', dpi=150, bbox_inches='tight')
    print("迂回指数分布图已保存：线状分布_迂回指数分布图.png")

def plot_network_dimension():
    """绘制网络分形维度分析图"""
    # 读取道路数据
    with open('road.geojson', 'r', encoding='utf-8') as f:
        road_data = json.load(f)
    
    lines = []
    for feature in road_data['features']:
        geom = feature['geometry']
        if geom['type'] == 'LineString':
            lines.append(LineString(geom['coordinates']))
    
    # 计算网络维度
    dimension = calculate_network_dimension(lines)
    total_length = sum(line.length for line in lines)
    num_roads = len(lines)
    
    print(f"\n网络分形维度统计：")
    print(f"  道路数量：{num_roads}")
    print(f"  道路总长度：{total_length:.2f} 度")
    print(f"  分形维度：{dimension:.4f}")
    
    # 创建图表
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # 1. 道路网络可视化
    for line in lines:
        coords = list(line.coords)
        x = [c[0] for c in coords]
        y = [c[1] for c in coords]
        ax1.plot(x, y, color='blue', linewidth=0.5, alpha=0.7)
    
    ax1.set_title(f'章贡区道路网络（分形维度: {dimension:.3f}）', fontsize=14)
    ax1.set_xlabel('经度')
    ax1.set_ylabel('纬度')
    ax1.set_aspect('equal')
    
    # 2. 维度解释图（分形维度含义）
    dimensions = [1.0, 1.5, 2.0]
    descriptions = ['线状结构\n(道路稀疏)', '中等复杂度\n(道路较密集)', '平面填充\n(道路密集)']
    colors = ['red', 'orange', 'green']
    
    for i, dim in enumerate(dimensions):
        ax2.bar(i, 1, color=colors[i], alpha=0.5)
        ax2.text(i, 0.5, f'D={dim}', ha='center', va='center', fontsize=12)
    
    # 当前维度标记
    normalized_pos = (dimension - 1.0) / (2.0 - 1.0)
    ax2.scatter(normalized_pos * 2, 1.1, color='black', s=100, marker='*', zorder=5)
    ax2.text(normalized_pos * 2, 1.2, f'当前: {dimension:.3f}', ha='center', fontsize=12, color='red')
    
    ax2.set_xticks([0, 1, 2])
    ax2.set_xticklabels(descriptions)
    ax2.set_yticks([])
    ax2.set_title('分形维度含义示意图', fontsize=14)
    ax2.set_ylim(-0.1, 1.3)
    
    plt.tight_layout()
    plt.savefig('线状分布_网络分形维度图.png', dpi=150, bbox_inches='tight')
    print("网络分形维度图已保存：线状分布_网络分形维度图.png")

if __name__ == '__main__':
    plot_detour_index_map()
    plot_network_dimension()
    print("\n所有网络指标图生成完成！")
