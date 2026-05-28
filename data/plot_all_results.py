import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from shapely.geometry import Polygon, MultiPolygon, LineString, Point
from shapely.ops import unary_union
from sklearn.decomposition import PCA

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def plot_point_results():
    """绘制点状分布测度结果折线图"""
    # 模拟数据（赣州区县数据）
    districts = ['章贡区', '南康区', '赣县区', '信丰县', '大余县', '上犹县', 
                 '崇义县', '安远县', '龙南县', '定南县', '全南县', '宁都县',
                 '于都县', '兴国县', '会昌县', '寻乌县', '石城县', '瑞金市']
    
    # 坐标数据（模拟）
    coords = np.array([[114.917, 25.817], [114.767, 25.583], [115.083, 25.950],
                       [114.983, 25.317], [114.333, 25.450], [114.583, 25.733],
                       [114.300, 25.667], [115.333, 25.100], [114.783, 24.967],
                       [115.033, 24.783], [114.717, 24.717], [115.900, 26.400],
                       [115.450, 25.900], [115.300, 26.300], [115.733, 25.533],
                       [115.600, 24.900], [116.333, 26.333], [116.083, 25.817]])
    
    # 人口数据（2020年，单位：万人）
    populations = [103.0, 88.9, 66.0, 70.2, 30.2, 26.8, 17.7, 35.3, 31.9,
                   20.9, 16.9, 83.5, 111.9, 71.5, 51.1, 31.5, 33.3, 71.3]
    
    # 计算测度值
    mean_center = (np.mean(coords[:, 0]), np.mean(coords[:, 1]))
    median_center = (np.median(coords[:, 0]), np.median(coords[:, 1]))
    weighted_center = (np.sum(coords[:, 0] * populations) / np.sum(populations),
                       np.sum(coords[:, 1] * populations) / np.sum(populations))
    
    # 绘制结果
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    # 散点图展示分布
    axes[0].scatter(coords[:, 0], coords[:, 1], c=populations, s=populations, 
                    cmap='RdBu', alpha=0.7)
    axes[0].scatter(mean_center[0], mean_center[1], c='red', s=200, marker='*', 
                    label='平均中心')
    axes[0].scatter(median_center[0], median_center[1], c='green', s=200, marker='*',
                    label='中项中心')
    axes[0].scatter(weighted_center[0], weighted_center[1], c='orange', s=200, 
                    marker='*', label='人口重心')
    axes[0].set_xlabel('经度')
    axes[0].set_ylabel('纬度')
    axes[0].set_title('赣州市区县分布与中心测度')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # 人口分布条形图
    axes[1].bar(range(len(districts)), populations, color='skyblue')
    axes[1].set_xticks(range(len(districts)))
    axes[1].set_xticklabels(districts, rotation=90)
    axes[1].set_ylabel('人口（万人）')
    axes[1].set_title('赣州市各区县人口分布')
    
    plt.tight_layout()
    plt.savefig('点状分布测度_综合图.png', dpi=150, bbox_inches='tight')
    print("点状分布测度综合图已保存：点状分布测度_综合图.png")

def plot_line_results():
    """绘制线状分布测度结果折线图"""
    # 读取道路数据
    with open('road.geojson', 'r', encoding='utf-8') as f:
        road_data = json.load(f)
    
    # 按道路类型统计
    road_types = ['主干道', '次干道', '支路', '高速公路', '其他']
    lengths = [0] * len(road_types)
    counts = [0] * len(road_types)
    
    for feature in road_data['features']:
        geom = feature['geometry']
        if geom['type'] == 'LineString':
            line = LineString(geom['coordinates'])
            # 简单分类：按长度
            if line.length > 0.1:
                lengths[0] += line.length
                counts[0] += 1
            elif line.length > 0.05:
                lengths[1] += line.length
                counts[1] += 1
            elif line.length > 0.02:
                lengths[2] += line.length
                counts[2] += 1
            else:
                lengths[4] += line.length
                counts[4] += 1
    
    # 绘制结果
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    # 道路长度分布
    axes[0].bar(road_types, lengths, color='green')
    axes[0].set_ylabel('长度（度）')
    axes[0].set_title('章贡区道路长度分布')
    
    # 道路数量分布
    axes[1].bar(road_types, counts, color='blue')
    axes[1].set_ylabel('数量（条）')
    axes[1].set_title('章贡区道路数量分布')
    
    plt.tight_layout()
    plt.savefig('线状分布测度_综合图.png', dpi=150, bbox_inches='tight')
    print("线状分布测度综合图已保存：线状分布测度_综合图.png")

def plot_area_results():
    """绘制面状分布测度结果系数图"""
    # 读取行政区划数据
    with open('章贡区.geojson', 'r', encoding='utf-8') as f:
        area_data = json.load(f)
    
    class AreaAnalyzer:
        def __init__(self, polygon):
            self.polygon = polygon
            self.area = polygon.area
            self.perimeter = polygon.length
        
        def elongation_ratio(self):
            coords = []
            if isinstance(self.polygon, MultiPolygon):
                for poly in self.polygon.geoms:
                    coords.extend(list(poly.exterior.coords))
            else:
                coords = list(self.polygon.exterior.coords)
            if len(coords) < 3:
                return 1.0
            coords = np.array(coords)
            centroid = np.mean(coords, axis=0)
            coords_centered = coords - centroid
            pca = PCA(n_components=2)
            pca.fit(coords_centered)
            eigenvalues = pca.explained_variance_
            if eigenvalues[0] > 0:
                return np.sqrt(eigenvalues[1] / eigenvalues[0])
            return 1.0
        
        def compactness_index(self):
            if self.perimeter <= 0:
                return 0.0
            ideal_perimeter = 2 * np.sqrt(np.pi * self.area)
            return ideal_perimeter / self.perimeter
        
        def circularity_ratio(self):
            if self.perimeter <= 0:
                return 0.0
            return (4 * np.pi * self.area) / (self.perimeter ** 2)
    
    # 计算各区域指标
    names = []
    elongations = []
    compactness = []
    circularity = []
    
    for feature in area_data['features']:
        name = feature['properties']['name']
        geom = feature['geometry']
        
        if geom['type'] == 'Polygon':
            polygon = Polygon(geom['coordinates'][0])
        elif geom['type'] == 'MultiPolygon':
            polygons = []
            for coords in geom['coordinates']:
                polygons.append(Polygon(coords[0]))
            polygon = MultiPolygon(polygons)
        
        analyzer = AreaAnalyzer(polygon)
        names.append(name)
        elongations.append(analyzer.elongation_ratio())
        compactness.append(analyzer.compactness_index())
        circularity.append(analyzer.circularity_ratio())
    
    # 创建子图
    fig = plt.figure(figsize=(20, 12))
    
    # 1. 形态指数折线图
    ax1 = fig.add_subplot(221)
    ax1.plot(names, elongations, marker='o', label='延伸率', color='red')
    ax1.plot(names, compactness, marker='s', label='紧凑指数', color='green')
    ax1.plot(names, circularity, marker='^', label='圆形率', color='blue')
    ax1.set_xticklabels(names, rotation=90)
    ax1.set_title('面状分布形态指数')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # 2. 紧凑指数柱状图
    ax2 = fig.add_subplot(222)
    ax2.bar(names, compactness, color='orange')
    ax2.set_xticklabels(names, rotation=90)
    ax2.set_title('各区域紧凑指数')
    
    # 3. 延伸率散点图
    ax3 = fig.add_subplot(223)
    ax3.scatter(circularity, elongations, s=100, c=compactness, cmap='viridis')
    ax3.set_xlabel('圆形率')
    ax3.set_ylabel('延伸率')
    ax3.set_title('形态指数关系图')
    ax3.grid(True, alpha=0.3)
    
    # 4. 行政区划图（带颜色编码）
    ax4 = fig.add_subplot(224)
    colors = plt.cm.viridis(np.array(compactness) / max(compactness))
    
    for i, feature in enumerate(area_data['features']):
        geom = feature['geometry']
        color = colors[i]
        
        if geom['type'] == 'Polygon':
            polygon = Polygon(geom['coordinates'][0])
            x, y = polygon.exterior.xy
            ax4.fill(x, y, alpha=0.7, fc=color, ec='black', linewidth=1)
        elif geom['type'] == 'MultiPolygon':
            for coords in geom['coordinates']:
                polygon = Polygon(coords[0])
                x, y = polygon.exterior.xy
                ax4.fill(x, y, alpha=0.7, fc=color, ec='black', linewidth=1)
    
    ax4.set_title('章贡区行政区划（紧凑指数颜色编码）')
    ax4.set_aspect('equal')
    
    plt.tight_layout()
    plt.savefig('面状分布测度_系数图.png', dpi=150, bbox_inches='tight')
    print("面状分布测度系数图已保存：面状分布测度_系数图.png")

if __name__ == '__main__':
    plot_point_results()
    plot_line_results()
    plot_area_results()
    print("\n所有图表生成完成！")
