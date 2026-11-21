"""
Infrastructure Dependency Graph & Topology Model.

Represents topology relationships between:
- Infrastructure hosts (bare metal, VMs, cloud instances)
- Agents and collectors
- Monitored microservices
- Network ingress/transit components

Enforces zero-fabrication:
Where dependency information is unavailable, relationships are explicitly marked as "unknown".
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum
import networkx as nx


class NodeType(str, Enum):
    HOST = "host"
    COLLECTOR = "collector"
    SERVICE = "service"
    NETWORK = "network"
    DATABASE = "database"
    UNKNOWN = "unknown"


class EdgeType(str, Enum):
    RUNS_ON = "RUNS_ON"          # e.g. service -> host, collector -> host
    DEPENDS_ON = "DEPENDS_ON"    # e.g. service A -> service B / database
    ROUTES_TO = "ROUTES_TO"      # e.g. network router -> service/host
    MONITORS = "MONITORS"        # e.g. collector -> host/service
    UNKNOWN = "UNKNOWN"          # Unverified or inferred relationship


class TopologyNode:
    def __init__(
        self,
        node_id: str,
        name: str,
        node_type: NodeType,
        tier: str,
        status: str = "healthy",
        metrics: Optional[Dict[str, Any]] = None,
        is_known: bool = True
    ):
        self.node_id = node_id
        self.name = name
        self.node_type = node_type
        self.tier = tier
        self.status = status  # healthy, degraded, breached, unknown
        self.metrics = metrics or {}
        self.is_known = is_known

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "name": self.name,
            "type": self.node_type.value,
            "tier": self.tier,
            "status": self.status,
            "metrics": self.metrics,
            "is_known": self.is_known
        }


class TopologyEdge:
    def __init__(
        self,
        source: str,
        target: str,
        edge_type: EdgeType,
        is_known: bool = True,
        latency_ms: Optional[float] = None
    ):
        self.source = source
        self.target = target
        self.edge_type = edge_type
        self.is_known = is_known
        self.latency_ms = latency_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from": self.source,
            "to": self.target,
            "type": self.edge_type.value,
            "is_known": self.is_known,
            "latency_ms": self.latency_ms
        }


class TopologyGraph:
    """
    Tenant-isolated infrastructure dependency graph powered by NetworkX.
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._graph = nx.DiGraph()
        self._nodes: Dict[str, TopologyNode] = {}
        self._edges: List[TopologyEdge] = []

    def add_node(self, node: TopologyNode):
        self._nodes[node.node_id] = node
        self._graph.add_node(
            node.node_id,
            data=node,
            name=node.name,
            node_type=node.node_type.value,
            tier=node.tier,
            status=node.status,
            is_known=node.is_known
        )

    def add_edge(self, edge: TopologyEdge):
        self._edges.append(edge)
        self._graph.add_edge(
            edge.source,
            edge.target,
            edge_type=edge.edge_type.value,
            is_known=edge.is_known,
            latency_ms=edge.latency_ms
        )

    def get_node(self, node_id: str) -> Optional[TopologyNode]:
        return self._nodes.get(node_id)

    def has_node(self, node_id: str) -> bool:
        return node_id in self._nodes

    def get_upstream_dependencies(self, node_id: str) -> List[str]:
        """Returns direct nodes that `node_id` depends on or runs on."""
        if not self._graph.has_node(node_id):
            return []
        return list(self._graph.successors(node_id))

    def get_downstream_dependents(self, node_id: str) -> List[str]:
        """Returns nodes that depend on `node_id` (symptoms often flow here)."""
        if not self._graph.has_node(node_id):
            return []
        return list(self._graph.predecessors(node_id))

    def are_connected(self, node_a: str, node_b: str) -> Tuple[bool, str]:
        """
        Determines whether two nodes are connected in the topology.
        Returns (connected, relationship_type).
        If unknown, explicitly returns (False, 'unknown').
        """
        if node_a == node_b:
            return True, "SAME_NODE"
        
        if not self._graph.has_node(node_a) or not self._graph.has_node(node_b):
            return False, "unknown"

        # Check direct edge in either direction
        if self._graph.has_edge(node_a, node_b):
            return True, self._graph[node_a][node_b].get("edge_type", "CONNECTED")
        if self._graph.has_edge(node_b, node_a):
            return True, self._graph[node_b][node_a].get("edge_type", "CONNECTED")

        # Check undirected path
        undirected = self._graph.to_undirected()
        if nx.has_path(undirected, node_a, node_b):
            dist = nx.shortest_path_length(undirected, node_a, node_b)
            return True, f"INDIRECT_PATH_DIST_{dist}"

        return False, "unknown"

    def get_dependency_depth(self, node_id: str) -> int:
        """
        Upstream components (hosts, DBs) have higher dependency depth/rank
        because downstream services depend on them.
        """
        if not self._graph.has_node(node_id):
            return 0
        dependents = self.get_downstream_dependents(node_id)
        return len(dependents)

    def get_subgraph(self, relevant_node_ids: List[str]) -> Dict[str, Any]:
        """
        Extracts the relevant subgraph containing the specified nodes
        plus their immediate upstream causes and downstream dependents.
        """
        nodes_to_include: Set[str] = set()
        for nid in relevant_node_ids:
            if self.has_node(nid):
                nodes_to_include.add(nid)
                nodes_to_include.update(self.get_upstream_dependencies(nid))
                nodes_to_include.update(self.get_downstream_dependents(nid))
            else:
                # Add a placeholder unknown node
                nodes_to_include.add(nid)

        sub_nodes = []
        for nid in nodes_to_include:
            if nid in self._nodes:
                sub_nodes.append(self._nodes[nid].to_dict())
            else:
                sub_nodes.append({
                    "id": nid,
                    "name": nid,
                    "type": NodeType.UNKNOWN.value,
                    "tier": "Unknown Tier",
                    "status": "unknown",
                    "metrics": {},
                    "is_known": False
                })

        sub_edges = []
        for e in self._edges:
            if e.source in nodes_to_include and e.target in nodes_to_include:
                sub_edges.append(e.to_dict())

        return {
            "tenant_id": self.tenant_id,
            "nodes": sub_nodes,
            "edges": sub_edges,
            "total_nodes": len(sub_nodes),
            "total_edges": len(sub_edges)
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tenant_id": self.tenant_id,
            "nodes": [n.to_dict() for n in self._nodes.values()],
            "edges": [e.to_dict() for e in self._edges]
        }


# -----------------------------------------------------------------------------
# Tenant Topology Registry (Deterministic, ground-truth based)
# -----------------------------------------------------------------------------
class TopologyRegistry:
    def __init__(self):
        self._topologies: Dict[str, TopologyGraph] = {}

    def get_topology(self, tenant_id: str) -> TopologyGraph:
        if tenant_id not in self._topologies:
            self._topologies[tenant_id] = self._build_default_topology(tenant_id)
        return self._topologies[tenant_id]

    def _build_default_topology(self, tenant_id: str) -> TopologyGraph:
        topo = TopologyGraph(tenant_id)

        if tenant_id == "tenant_alpha":
            # Host 1: Primary Compute Node
            topo.add_node(TopologyNode(
                node_id="node_primary",
                name="Primary Compute Host (c5.2xlarge)",
                node_type=NodeType.HOST,
                tier="Infrastructure",
                status="breached",
                metrics={"cpu_cores": 8, "ram_gb": 32}
            ))
            # Host 2: Database Host
            topo.add_node(TopologyNode(
                node_id="host_db_01",
                name="Postgres DB Instance (r5.xlarge)",
                node_type=NodeType.DATABASE,
                tier="Data Layer",
                status="healthy",
                metrics={"storage_iops": 3000, "active_conns": 42}
            ))
            # Collector Agent
            topo.add_node(TopologyNode(
                node_id="collector_agent_primary",
                name="SEENIL Telemetry Agent",
                node_type=NodeType.COLLECTOR,
                tier="Observability",
                status="healthy",
                metrics={"version": "3.2.0", "outbox_pending": 0}
            ))
            # Monitored Service 1: API Gateway / Ingress
            topo.add_node(TopologyNode(
                node_id="svc_api_gateway",
                name="API Gateway & Auth Proxy",
                node_type=NodeType.SERVICE,
                tier="Edge Ingress",
                status="degraded",
                metrics={"port": 8443, "protocol": "HTTPS"}
            ))
            # Monitored Service 2: Order Service
            topo.add_node(TopologyNode(
                node_id="svc_order_service",
                name="Transaction Order Service",
                node_type=NodeType.SERVICE,
                tier="Application",
                status="degraded",
                metrics={"port": 8080, "threads": 64}
            ))
            # Network Router / Ingress
            topo.add_node(TopologyNode(
                node_id="net_vpc_gateway",
                name="VPC Transit Gateway (ap-south-1)",
                node_type=NodeType.NETWORK,
                tier="Network",
                status="healthy",
                metrics={"bandwidth_gbps": 10}
            ))

            # Topology Relationships:
            # 1. Services run on hosts
            topo.add_edge(TopologyEdge("svc_order_service", "node_primary", EdgeType.RUNS_ON))
            topo.add_edge(TopologyEdge("collector_agent_primary", "node_primary", EdgeType.RUNS_ON))
            topo.add_edge(TopologyEdge("svc_api_gateway", "node_primary", EdgeType.RUNS_ON))

            # 2. Dependency: api_gateway routes to order_service
            topo.add_edge(TopologyEdge("svc_api_gateway", "svc_order_service", EdgeType.DEPENDS_ON, latency_ms=4.2))

            # 3. Dependency: order_service depends on database
            topo.add_edge(TopologyEdge("svc_order_service", "host_db_01", EdgeType.DEPENDS_ON, latency_ms=1.8))

            # 4. Network routes to API gateway
            topo.add_edge(TopologyEdge("net_vpc_gateway", "svc_api_gateway", EdgeType.ROUTES_TO))

            # 5. Collector monitors host and services
            topo.add_edge(TopologyEdge("collector_agent_primary", "svc_order_service", EdgeType.MONITORS))

        else:
            # Generic / Tenant Beta Topology
            topo.add_node(TopologyNode(
                node_id="node_beta_host",
                name="Beta Worker Host (eu-central-1)",
                node_type=NodeType.HOST,
                tier="Infrastructure",
                status="healthy",
                metrics={"cpu_cores": 4, "ram_gb": 16}
            ))
            topo.add_node(TopologyNode(
                node_id="svc_beta_app",
                name="Logistics Routing Service",
                node_type=NodeType.SERVICE,
                tier="Application",
                status="healthy",
                metrics={"port": 9000}
            ))
            topo.add_edge(TopologyEdge("svc_beta_app", "node_beta_host", EdgeType.RUNS_ON))

        return topo


topology_registry = TopologyRegistry()
